from __future__ import annotations

import re
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import pypdf

from .base import BaseExtractor
from ..models.schema import ShellEntity, Mortgage, CodeViolation, Property, ViolationSeverity
from ..llm.client import BaseLLMClient, get_llm_client


class DocumentOCRExtractor(BaseExtractor):
    """Universal document and OCR ingestion engine.

    Extracts text from scanned PDFs, images, and text filings using local OCR
    and feeds them to ANY configured language model (Ollama, OpenAI, Groq, DeepSeek, etc.)
    for high-precision entity and crossover extraction.
    """

    def __init__(
        self,
        llm_client: Optional[BaseLLMClient] = None,
        task_name: str = "universal_document_ocr_ingestion",
    ):
        super().__init__(task_name=task_name)
        self.llm = llm_client or get_llm_client()

    def extract_text_from_file(self, file_path: Path) -> str:
        """Extracts raw text from PDF, image, or text file."""
        suffix = file_path.suffix.lower()

        if suffix in [".txt", ".html", ".htm", ".json", ".csv"]:
            return file_path.read_text(encoding="utf-8", errors="ignore")

        if suffix == ".pdf":
            extracted_text = []
            try:
                reader = pypdf.PdfReader(str(file_path))
                for idx, page in enumerate(reader.pages):
                    t = page.extract_text() or ""
                    extracted_text.append(t)
            except Exception as e:
                extracted_text.append(f"[Error reading PDF pages: {e}]")

            full_text = "\n".join(extracted_text).strip()
            if full_text:
                return full_text

            # If digital text was empty, try OCR fallback
            return self._ocr_pdf_pages(file_path)

        # Image fallback (.png, .jpg, .tiff)
        if suffix in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
            return self._ocr_image_file(file_path)

        return file_path.read_text(encoding="utf-8", errors="ignore")

    def _ocr_pdf_pages(self, pdf_path: Path) -> str:
        """Renders PDF pages to images and runs local OCR."""
        try:
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(str(pdf_path))
            ocr_text = []
            for i, page in enumerate(pdf):
                image = page.render(scale=2).to_pil()
                text = self._ocr_pil_image(image)
                ocr_text.append(f"--- Page {i+1} ---\n{text}")
            return "\n".join(ocr_text)
        except Exception as e:
            return f"[OCR fallback unavailable: {e}]"

    def _ocr_image_file(self, img_path: Path) -> str:
        try:
            from PIL import Image
            img = Image.open(img_path)
            return self._ocr_pil_image(img)
        except Exception as e:
            return f"[Image OCR error: {e}]"

    def _ocr_pil_image(self, pil_image) -> str:
        # Try pytesseract first
        try:
            import pytesseract
            return pytesseract.image_to_string(pil_image)
        except Exception:
            pass

        # Try easyocr fallback
        try:
            import easyocr
            import numpy as np
            reader = easyocr.Reader(["en"], gpu=False)
            res = reader.readtext(np.array(pil_image))
            return "\n".join([r[1] for r in res])
        except Exception as e:
            return f"[Local OCR failed: {e}]"

    def extract_corporate_filing(self, raw_text: str) -> ShellEntity:
        """Uses the language model to parse an unstructured Secretary of State filing."""
        prompt = (
            "You are an expert legal corporate records analyst. Extract the entity details from this "
            "Secretary of State business filing or articles of organization.\n\n"
            f"DOCUMENT TEXT:\n{raw_text[:4000]}\n"
        )
        system_prompt = "Extract legal corporate registration metadata into clean structured JSON."
        
        # Extract via LLM structured output
        entity = self.llm.generate_structured(
            prompt=prompt,
            response_model=ShellEntity,
            system_prompt=system_prompt,
        )
        self.record_tokens(len(prompt) // 4, 150)
        return entity

    def extract_mortgage_lien(self, raw_text: str) -> Mortgage:
        """Uses the language model to parse an unstructured recorded mortgage or deed."""
        prompt = (
            "You are a commercial real estate legal investigator. Extract mortgage loan details, "
            "lender name, borrower LLC, cross-collateralized parcel PINs, and personal guarantor names from this deed/mortgage:\n\n"
            f"DOCUMENT TEXT:\n{raw_text[:4000]}\n"
        )
        system_prompt = "Extract commercial recorded mortgage covenants into clean structured JSON."

        mortgage = self.llm.generate_structured(
            prompt=prompt,
            response_model=Mortgage,
            system_prompt=system_prompt,
        )
        self.record_tokens(len(prompt) // 4, 150)
        return mortgage

    def extract(self, raw_input: Any) -> Any:
        path = Path(raw_input)
        text = self.extract_text_from_file(path)
        return text
