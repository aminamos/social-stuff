from __future__ import annotations

import abc
from typing import Dict, Any, List
from ..models.schema import TokenUsageReport


class BaseExtractor(abc.ABC):
    """Base class for all data extractors with token accounting."""

    def __init__(self, task_name: str, model_name: str = "gemini-1.5-pro"):
        self.task_name = task_name
        self.model_name = model_name
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def record_tokens(self, prompt_toks: int, completion_toks: int) -> None:
        self.prompt_tokens += prompt_toks
        self.completion_tokens += completion_toks

    def get_token_report(self) -> TokenUsageReport:
        # Standard pricing: ~$1.25/M prompt, $5.00/M completion
        cost = (self.prompt_tokens / 1_000_000 * 1.25) + (self.completion_tokens / 1_000_000 * 5.00)
        return TokenUsageReport(
            task_name=self.task_name,
            prompt_tokens=self.prompt_tokens,
            completion_tokens=self.completion_tokens,
            total_tokens=self.prompt_tokens + self.completion_tokens,
            estimated_cost_usd=round(cost, 6),
        )

    @abc.abstractmethod
    def extract(self, raw_input: Any) -> Any:
        pass
