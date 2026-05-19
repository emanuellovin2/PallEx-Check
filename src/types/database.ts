export type Role = "admin" | "driver";

export type ChecklistStatus = "draft" | "submitted";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus = "open" | "reviewing" | "resolved" | "closed";
export type PhotoType = "front" | "back" | "side" | "damage" | "pre_check" | "post_check" | "other";
export type VehicleDocType =
  | "rca"
  | "carte_verde"
  | "itp"
  | "tahograf"
  | "revizie_ulei"
  | "revizie_generala"
  | "rovinieta"
  | "licenta_transport"
  | "cmr";

export const VEHICLE_DOC_LABELS: Record<VehicleDocType, string> = {
  rca: "RCA",
  carte_verde: "Carte Verde",
  itp: "ITP",
  tahograf: "Tahograf",
  revizie_ulei: "Revizie Ulei",
  revizie_generala: "Revizie Generală",
  rovinieta: "Rovignietă",
  licenta_transport: "Licență Transport",
  cmr: "Asigurare CMR",
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Role;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: Role;
        };
        Update: {
          full_name?: string;
          role?: Role;
          updated_at?: string;
        };
      };

      vehicles: {
        Row: {
          id: string;
          plate_number: string;
          model: string;
          assigned_driver_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plate_number: string;
          model: string;
          assigned_driver_id?: string | null;
        };
        Update: {
          plate_number?: string;
          model?: string;
          assigned_driver_id?: string | null;
          updated_at?: string;
        };
      };

      checklists: {
        Row: {
          id: string;
          driver_id: string;
          vehicle_id: string;
          gps_lat: number | null;
          gps_lng: number | null;
          status: ChecklistStatus;
          locked: boolean;
          created_at: string;
          submitted_at: string | null;
        };
        Insert: {
          driver_id: string;
          vehicle_id: string;
          gps_lat?: number | null;
          gps_lng?: number | null;
          status?: ChecklistStatus;
        };
        Update: {
          status?: ChecklistStatus;
          locked?: boolean;
          submitted_at?: string | null;
          gps_lat?: number | null;
          gps_lng?: number | null;
        };
      };

      checklist_checks: {
        Row: {
          id: string;
          checklist_id: string;
          tyre_front_left: boolean | null;
          tyre_front_right: boolean | null;
          tyre_rear_left: boolean | null;
          tyre_rear_right: boolean | null;
          tyre_spare: boolean | null;
          headlights: boolean | null;
          taillights: boolean | null;
          indicators: boolean | null;
          hazard_lights: boolean | null;
          brake_lights: boolean | null;
          foot_brake: boolean | null;
          handbrake: boolean | null;
          engine_oil: boolean | null;
          coolant: boolean | null;
          brake_fluid: boolean | null;
          washer_fluid: boolean | null;
          fuel_level: boolean | null;
          windscreen: boolean | null;
          wipers: boolean | null;
          mirrors: boolean | null;
          doors_secure: boolean | null;
          seatbelts: boolean | null;
          horn: boolean | null;
          cargo_secured: boolean | null;
          load_distribution: boolean | null;
          pallet_condition: boolean | null;
          fire_extinguisher: boolean | null;
          first_aid_kit: boolean | null;
          warning_triangles: boolean | null;
          hi_vis_vest: boolean | null;
          vehicle_registration: boolean | null;
          insurance_docs: boolean | null;
          driver_licence: boolean | null;
          notes: string | null;
          // Cargo
          cargo_type: string | null;
          cargo_quantity: number | null;
          cargo_notes: string | null;
          // Damage
          has_damage: boolean | null;
          damage_description: string | null;
          damage_voice_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          checklist_id: string;
          notes?: string | null;
          [key: string]: boolean | string | null | undefined;
        };
        Update: {
          notes?: string | null;
          [key: string]: boolean | string | null | undefined;
        };
      };

      checklist_photos: {
        Row: {
          id: string;
          checklist_id: string;
          url: string;
          type: PhotoType;
          created_at: string;
        };
        Insert: {
          checklist_id: string;
          url: string;
          type?: PhotoType;
        };
        Update: never;
      };

      incidents: {
        Row: {
          id: string;
          driver_id: string;
          vehicle_id: string | null;
          title: string;
          gps_lat: number | null;
          gps_lng: number | null;
          voice_text: string | null;
          description: string | null;
          severity: IncidentSeverity;
          status: IncidentStatus;
          has_damage: boolean;
          locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          vehicle_id?: string | null;
          title: string;
          gps_lat?: number | null;
          gps_lng?: number | null;
          voice_text?: string | null;
          description?: string | null;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          has_damage?: boolean;
          locked?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          voice_text?: string | null;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          has_damage?: boolean;
          locked?: boolean;
          updated_at?: string;
        };
      };

      incident_photos: {
        Row: {
          id: string;
          incident_id: string;
          path: string;
          created_at: string;
        };
        Insert: {
          incident_id: string;
          path: string;
        };
        Update: never;
      };

      vehicle_documents: {
        Row: {
          id: string;
          vehicle_id: string;
          doc_type: VehicleDocType;
          label: string;
          expires_at: string;
          issued_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          vehicle_id: string;
          doc_type: VehicleDocType;
          label: string;
          expires_at: string;
          issued_at?: string | null;
          notes?: string | null;
        };
        Update: {
          doc_type?: VehicleDocType;
          label?: string;
          expires_at?: string;
          issued_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };

      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          device_info: Record<string, unknown> | null;
          timestamp: string;
        };
        Insert: never; // use log_audit() function
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      log_audit: {
        Args: {
          p_action: string;
          p_entity: string;
          p_entity_id?: string;
          p_device_info?: Record<string, unknown>;
        };
        Returns: void;
      };
      finalize_incident: {
        Args: {
          p_incident_id: string;
          p_photo_paths: string[];
          p_device_info?: Record<string, unknown>;
        };
        Returns: void;
      };
    };
    Enums: {
      app_role: Role;
      checklist_status: ChecklistStatus;
      incident_severity: IncidentSeverity;
      incident_status: IncidentStatus;
      photo_type: PhotoType;
      vehicle_doc_type: VehicleDocType;
    };
  };
};
