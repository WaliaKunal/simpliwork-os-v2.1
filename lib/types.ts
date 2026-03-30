export type DealStage =
  | "Qualified"
  | "Solutioning"
  | "Proposal Sent"
  | "Negotiation"
  | "LoI Initiated"
  | "LoI Signed"
  | "Lost";

export type LayoutStatus =
  | "not_requested"
  | "layout_pending_approval"
  | "layout_approved"
  | "layout_rejected"
  | "layout_uploaded"
  | "layout_revision_requested";

export interface LayoutVersion {
  versionNumber: number;
  url: string;
  uploadedAt: string | Date;
  uploadedBy: string;
}

export interface ActivityLog {
  user_email: string;
  role: string;
  action_type: string;
  note: string;
  timestamp: string | Date;
}

export interface Deal {
  deal_id: string;
  deal_code: string;
  company_name: string;
  stage: DealStage;
  deal_phase?: string;
  sales_owner_email: string;
  building_id: string;
  layout_status: LayoutStatus;
  layout_revision_count: number;
  createdAt: string | Date;
  updatedAt: string | Date;

  source_type?: string;
  source_organisation?: string;
  source_name?: string;
  sqft?: number;
  latest_feedback?: string;
  layout_requested_date?: string | Date;
  layout_uploaded_date?: string | Date;
  layout_shared_with_client_date?: string | Date;
  design_discussion_status?: string;
  design_discussion_date?: string | Date;
  design_discussion_notes?: string;
  layout_versions?: LayoutVersion[];
  activity_logs?: ActivityLog[];
}
