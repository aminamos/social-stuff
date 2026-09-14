from __future__ import annotations

import os
import re
import json
import abc
from typing import Dict, Any, Optional, List, Type, TypeVar
from pydantic import BaseModel
import httpx

T = TypeVar("T", bound=BaseModel)


class LLMResponse(BaseModel):
    text: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    model: str = "generic"
    provider: str = "generic"


class BaseLLMClient(abc.ABC):
    """Abstract interface for any language model provider."""

    @abc.abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        pass

    @abc.abstractmethod
    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        pass


class OpenAICompatibleClient(BaseLLMClient):
    """Universal client for ANY OpenAI-compatible API endpoint:

    Ollama, LM Studio, vLLM, LocalAI, Groq, Together, DeepSeek, Mistral, OpenAI, etc.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 60.0,
    ):
        self.base_url = (
            base_url
            or os.environ.get("OPENAI_BASE_URL")
            or os.environ.get("OLLAMA_BASE_URL")
            or "https://api.openai.com/v1"
        ).rstrip("/")
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY") or "dummy-key-for-local-llm"
        self.model = model or os.environ.get("LLM_MODEL") or "llama3.2"
        self.timeout = timeout

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        url = f"{self.base_url}/chat/completions"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            choice = data["choices"][0]["message"]
            usage = data.get("usage", {})
            return LLMResponse(
                text=choice.get("content", ""),
                prompt_tokens=usage.get("prompt_tokens", len(prompt) // 4),
                completion_tokens=usage.get("completion_tokens", len(choice.get("content", "")) // 4),
                total_tokens=usage.get("total_tokens", 0),
                model=self.model,
                provider="openai_compatible",
            )
        except Exception as e:
            # Fallback / descriptive error
            raise RuntimeError(f"Error calling OpenAI-compatible LLM at {url} (model: {self.model}): {e}")

    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        instruction = (
            f"\n\nCRITICAL: Respond ONLY with a valid JSON object strictly matching this schema:\n"
            f"```json\n{schema_json}\n```\nDo not include any conversational commentary or prose outside the JSON."
        )
        full_prompt = prompt + instruction
        res = self.generate(full_prompt, system_prompt=system_prompt)
        text = res.text.strip()
        # Clean markdown fences if model outputs ```json ... ```
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        try:
            parsed = json.loads(text)
            return response_model.model_validate(parsed)
        except Exception as e:
            raise ValueError(f"Failed to parse LLM structured output into {response_model.__name__}: {e}\nRaw output:\n{text}")


class OfflineRuleBasedClient(BaseLLMClient):
    """Reliable local/offline rule-based extractor for zero-token testing and air-gapped runs."""

    def __init__(self, model_name: str = "offline-rule-engine"):
        self.model_name = model_name

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        return LLMResponse(
            text="[Offline Rule Engine Extraction]",
            prompt_tokens=len(prompt) // 4,
            completion_tokens=40,
            total_tokens=(len(prompt) // 4) + 40,
            model=self.model_name,
            provider="offline",
        )

    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        # Heuristic regex extraction for offline testing
        data: Dict[str, Any] = {}
        # Try extracting entity name
        m_name = re.search(r"(?:name of (?:this )?company is:?|legal name:?)\s*([A-Z0-9\s,]+LLC|[A-Z0-9\s,]+INC)", prompt, re.IGNORECASE)
        name = m_name.group(1).strip() if m_name else "EXTRACTED_ENTITY_LLC"
        data["legal_name"] = name
        data["normalized_name"] = name.upper()
        data["entity_id"] = re.sub(r"[^a-zA-Z0-9]", "_", name.lower())

        # Try extracting registered agent
        m_agent = re.search(r"Registered Agent:\s*([^\n\r]+)", prompt, re.IGNORECASE)
        if m_agent:
            data["registered_agent_name"] = m_agent.group(1).strip()

        # Try extracting principal office
        m_office = re.search(r"Principal Executive Office(?:\s*Address)?:\s*([^\n\r]+)", prompt, re.IGNORECASE)
        if m_office:
            data["principal_office_address"] = m_office.group(1).strip()

        # Try extracting governors/managers
        governors = []
        for line in prompt.splitlines():
            if any(k in line.lower() for k in ["governor", "manager", "organizer", "officer"]):
                cleaned = re.sub(r"^\s*[\d\.\-\*]+\s*", "", line)
                cleaned = re.sub(r"\s*-\s*(?:Governor|Manager|Organizer|Officer).*", "", cleaned, flags=re.IGNORECASE)
                if cleaned and len(cleaned) < 50 and not any(w in cleaned.lower() for w in ["article", "witness", "initial"]):
                    governors.append(cleaned.strip())
        data["known_governors"] = governors
        data["known_managers"] = governors

        # For mortgages
        data.setdefault("recording_number", "DOC-OFFLINE-001")
        data.setdefault("lender_name", "Offline Commercial Noteholder")
        data.setdefault("borrower_name", name)
        data.setdefault("principal_amount", 1000000.0)
        data.setdefault("recording_date", "2024-01-01")

        return response_model.model_validate(data)


def get_llm_client(
    provider: Optional[str] = None,
    base_url: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> BaseLLMClient:
    """Factory creating an LLM client based on flags or environment variables."""
    prov = (provider or os.environ.get("LLM_PROVIDER") or "auto").lower()

    if prov == "offline":
        return OfflineRuleBasedClient()

    if prov in ("ollama", "local", "vllm", "lmstudio"):
        default_url = "http://localhost:11434/v1" if prov == "ollama" else "http://localhost:1234/v1"
        return OpenAICompatibleClient(
            base_url=base_url or os.environ.get("OLLAMA_BASE_URL") or default_url,
            api_key=api_key or "ollama",
            model=model or "llama3.2",
        )

    if prov in ("openai", "groq", "together", "deepseek", "openai_compatible"):
        return OpenAICompatibleClient(
            base_url=base_url,
            api_key=api_key,
            model=model or "gpt-4o-mini",
        )

    # Auto-detection from environment:
    if os.environ.get("OPENAI_API_KEY"):
        return OpenAICompatibleClient(base_url=base_url, api_key=api_key, model=model or "gpt-4o-mini")
    if os.environ.get("OLLAMA_BASE_URL") or os.environ.get("OPENAI_BASE_URL"):
        return OpenAICompatibleClient(base_url=base_url, api_key=api_key, model=model)

    # Default fallback: OpenAI-compatible local client (or offline mode if no server)
    return OpenAICompatibleClient(
        base_url=base_url or "http://localhost:11434/v1",
        api_key=api_key or "local",
        model=model or "llama3.2",
    )
