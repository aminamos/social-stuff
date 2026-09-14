from __future__ import annotations

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AddressType(str, Enum):
    PROPERTY = "PROPERTY"
    REGISTERED_AGENT_COMMERCIAL = "REGISTERED_AGENT_COMMERCIAL"
    PRIVATE_OFFICE = "PRIVATE_OFFICE"
    RESIDENTIAL = "RESIDENTIAL"
    PO_BOX = "PO_BOX"
    UNKNOWN = "UNKNOWN"


class ViolationSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL_LIFE_SAFETY = "CRITICAL_LIFE_SAFETY"


class RelationType(str, Enum):
    OWNS = "OWNS"
    REGISTERED_AT = "REGISTERED_AT"
    HAS_OFFICER = "HAS_OFFICER"
    MANAGED_BY = "MANAGED_BY"
    FINANCED_BY = "FINANCED_BY"
    CITED_FOR = "CITED_FOR"
    CROSS_COLLATERALIZED_WITH = "CROSS_COLLATERALIZED_WITH"
    SAME_UBO_AS = "SAME_UBO_AS"


class Address(BaseModel):
    raw_address: str
    normalized_address: str
    street: Optional[str] = None
    city: str = "Minneapolis"
    state: str = "MN"
    zip_code: Optional[str] = None
    address_type: AddressType = AddressType.UNKNOWN
    is_commercial_agent_clearinghouse: bool = False


class Property(BaseModel):
    parcel_id: str  # County PIN
    address: str
    city: str = "Minneapolis"
    state: str = "MN"
    zip_code: str
    unit_count: int = 1
    assessed_value: float = 0.0
    taxpayer_name: str
    taxpayer_address: str
    owner_of_record: str
    rental_license_status: str = "ACTIVE"
    rental_license_contact_name: Optional[str] = None
    rental_license_contact_phone: Optional[str] = None


class ShellEntity(BaseModel):
    entity_id: str
    legal_name: str
    normalized_name: str
    state_of_formation: str = "MN"
    filing_number: Optional[str] = None
    formation_date: Optional[str] = None
    status: str = "Active"
    registered_agent_name: Optional[str] = None
    registered_agent_address: Optional[str] = None
    principal_office_address: Optional[str] = None
    known_governors: List[str] = Field(default_factory=list)
    known_managers: List[str] = Field(default_factory=list)


class Person(BaseModel):
    person_id: str
    full_name: str
    normalized_name: str
    aliases: List[str] = Field(default_factory=list)
    affiliated_entities: List[str] = Field(default_factory=list)  # entity_ids
    primary_address: Optional[str] = None
    is_commercial_agent_dummy: bool = False


class Mortgage(BaseModel):
    recording_number: str
    lender_name: str
    borrower_name: str
    borrower_entity_id: Optional[str] = None
    principal_amount: float
    recording_date: str
    cross_collateralized_parcels: List[str] = Field(default_factory=list)
    guarantor_names: List[str] = Field(default_factory=list)
    master_credit_facility_name: Optional[str] = None


class CodeViolation(BaseModel):
    violation_id: str
    parcel_id: str
    property_address: str
    citation_date: str
    category: str
    description: str
    severity: ViolationSeverity
    status: str = "OPEN"
    fine_amount: float = 0.0


class OwnershipEdge(BaseModel):
    source_id: str
    target_id: str
    relation: RelationType
    weight: float = 1.0
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    evidence: List[str] = Field(default_factory=list)


class BeneficialOwnerCluster(BaseModel):
    cluster_id: str
    cluster_alias: str
    ultimate_beneficial_owners: List[str] = Field(default_factory=list)
    confidence_score: float = 1.0
    property_parcel_ids: List[str] = Field(default_factory=list)
    property_addresses: List[str] = Field(default_factory=list)
    shell_entity_ids: List[str] = Field(default_factory=list)
    shell_entity_names: List[str] = Field(default_factory=list)
    key_principals: List[str] = Field(default_factory=list)
    total_units: int = 0
    total_assessed_value: float = 0.0
    open_violations_count: int = 0
    critical_violations_count: int = 0
    total_mortgage_debt: float = 0.0
    primary_lenders: List[str] = Field(default_factory=list)
    shared_markers: Dict[str, Any] = Field(default_factory=dict)


class TokenUsageReport(BaseModel):
    task_name: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0
