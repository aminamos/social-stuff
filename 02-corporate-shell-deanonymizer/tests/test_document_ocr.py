from __future__ import annotations

from pathlib import Path
import pytest

from src.extractors.document_ocr import DocumentOCRExtractor
from src.llm.client import OfflineRuleBasedClient
from src.models.schema import ShellEntity


def test_document_ocr_text_extraction():
    test_file = Path(__file__).resolve().parent.parent / "data" / "sample_fixtures" / "sample_scanned_filing.txt"
    llm = OfflineRuleBasedClient()
    extractor = DocumentOCRExtractor(llm_client=llm)

    text = extractor.extract_text_from_file(test_file)
    assert "ARTICLES OF ORGANIZATION" in text
    assert "CT Corporation System" in text
    assert "Marcus Vance" in text


def test_document_ocr_structured_filing_extraction():
    test_file = Path(__file__).resolve().parent.parent / "data" / "sample_fixtures" / "sample_scanned_filing.txt"
    llm = OfflineRuleBasedClient()
    extractor = DocumentOCRExtractor(llm_client=llm)

    text = extractor.extract_text_from_file(test_file)
    entity = extractor.extract_corporate_filing(text)

    assert isinstance(entity, ShellEntity)
    assert entity.registered_agent_name == "CT Corporation System"
    assert "Marcus Vance" in entity.known_governors
    assert "7400 Metro Blvd" in (entity.principal_office_address or "")
