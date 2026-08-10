export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            companies: {
                Row: {
                    id: string
                    name: string
                    domain: string | null
                    status: 'active' | 'inactive'
                    deactivated_at: string | null
                    deactivated_by: string | null
                    deactivation_reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    domain?: string | null
                    status?: 'active' | 'inactive'
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                    deactivation_reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    domain?: string | null
                    status?: 'active' | 'inactive'
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                    deactivation_reason?: string | null
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    auth_user_id: string | null
                    email: string
                    full_name: string | null
                    role: 'admin' | 'user'
                    company_id: string | null
                    status: 'active' | 'inactive' | 'anonymized'
                    deactivated_at: string | null
                    deactivated_by: string | null
                    deactivation_reason: string | null
                    anonymized_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    auth_user_id?: string | null
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'user'
                    company_id?: string | null
                    status?: 'active' | 'inactive' | 'anonymized'
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                    deactivation_reason?: string | null
                    anonymized_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    auth_user_id?: string | null
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'user'
                    company_id?: string | null
                    status?: 'active' | 'inactive' | 'anonymized'
                    deactivated_at?: string | null
                    deactivated_by?: string | null
                    deactivation_reason?: string | null
                    anonymized_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            buildings: {
                Row: {
                    id: string
                    name: string
                    address: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    address?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string | null
                    created_at?: string
                }
            }
            floors: {
                Row: {
                    id: string
                    building_id: string
                    name: string
                    level_number: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    building_id: string
                    name: string
                    level_number: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    building_id?: string
                    name?: string
                    level_number?: number
                    created_at?: string
                }
            }
            rooms: {
                Row: {
                    id: string
                    floor_id: string
                    name: string
                    capacity: number
                    amenities: string[] | null
                    image_url: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    floor_id: string
                    name: string
                    capacity?: number
                    amenities?: string[] | null
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    floor_id?: string
                    name?: string
                    capacity?: number
                    amenities?: string[] | null
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    room_id: string
                    user_id: string
                    responsible_profile_id: string
                    company_id: string | null
                    title: string
                    description: string | null
                    start_time: string
                    end_time: string
                    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    recurrence_rule: string | null
                    parent_booking_id: string | null
                    decided_at: string | null
                    decided_by: string | null
                    cancelled_at: string | null
                    cancelled_by: string | null
                    cancellation_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    room_id: string
                    user_id: string
                    responsible_profile_id: string
                    company_id?: string | null
                    title: string
                    description?: string | null
                    start_time: string
                    end_time: string
                    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    recurrence_rule?: string | null
                    parent_booking_id?: string | null
                    decided_at?: string | null
                    decided_by?: string | null
                    cancelled_at?: string | null
                    cancelled_by?: string | null
                    cancellation_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string
                    user_id?: string
                    responsible_profile_id?: string
                    company_id?: string | null
                    title?: string
                    description?: string | null
                    start_time?: string
                    end_time?: string
                    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    recurrence_rule?: string | null
                    parent_booking_id?: string | null
                    decided_at?: string | null
                    decided_by?: string | null
                    cancelled_at?: string | null
                    cancelled_by?: string | null
                    cancellation_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            audit_events: {
                Row: {
                    id: string
                    entity_type: 'booking' | 'company' | 'profile'
                    entity_id: string | null
                    action: string
                    actor_id: string | null
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    entity_type: 'booking' | 'company' | 'profile'
                    entity_id?: string | null
                    action: string
                    actor_id?: string | null
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    entity_type?: 'booking' | 'company' | 'profile'
                    entity_id?: string | null
                    action?: string
                    actor_id?: string | null
                    metadata?: Json
                    created_at?: string
                }
            }
        }
        Functions: {
            anonymize_user: {
                Args: { p_profile_id: string; p_confirmation: string }
                Returns: string | null
            }
            current_company_id: {
                Args: Record<PropertyKey, never>
                Returns: string | null
            }
            current_profile_id: {
                Args: Record<PropertyKey, never>
                Returns: string | null
            }
            get_booking_availability: {
                Args: {
                    p_range_start: string
                    p_range_end: string
                    p_room_id?: string | null
                }
                Returns: {
                    room_id: string
                    room_name: string
                    start_time: string
                    end_time: string
                }[]
            }
            get_company_admin_summary: {
                Args: Record<PropertyKey, never>
                Returns: {
                    company_id: string
                    company_name: string
                    company_domain: string | null
                    company_status: 'active' | 'inactive'
                    deactivation_reason: string | null
                    created_at: string
                    user_count: number
                    booking_count: number
                }[]
            }
            get_user_admin_summary: {
                Args: Record<PropertyKey, never>
                Returns: {
                    profile_id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'user'
                    company_id: string | null
                    profile_status: 'active' | 'inactive' | 'anonymized'
                    deactivation_reason: string | null
                    created_at: string
                    booking_count: number
                    future_responsibility_count: number
                    has_auth_account: boolean
                }[]
            }
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            purge_booking: {
                Args: { p_booking_id: string; p_confirmation: string }
                Returns: undefined
            }
            purge_company: {
                Args: { p_company_id: string; p_confirmation: string }
                Returns: { deleted_bookings: number; detached_users: number }[]
            }
            set_company_status: {
                Args: {
                    p_company_id: string
                    p_status: 'active' | 'inactive'
                    p_reason?: string | null
                }
                Returns: 'active' | 'inactive'
            }
            set_user_status: {
                Args: {
                    p_profile_id: string
                    p_status: 'active' | 'inactive'
                    p_reason?: string | null
                    p_replacement_profile_id?: string | null
                }
                Returns: number
            }
            transition_booking: {
                Args: {
                    p_booking_id: string
                    p_target_status: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    p_reason?: string | null
                }
                Returns: {
                    booking_id: string
                    previous_status: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    current_status: 'pending' | 'approved' | 'rejected' | 'cancelled'
                }[]
            }
            update_user_admin: {
                Args: {
                    p_profile_id: string
                    p_full_name: string
                    p_email: string
                    p_role: 'admin' | 'user'
                    p_company_id: string | null
                    p_replacement_profile_id?: string | null
                }
                Returns: number
            }
            update_company_admin: {
                Args: {
                    p_company_id: string
                    p_name: string
                    p_domain?: string | null
                }
                Returns: string
            }
        }
        Enums: {
            booking_status: 'pending' | 'approved' | 'rejected' | 'cancelled'
            company_status: 'active' | 'inactive'
            profile_status: 'active' | 'inactive' | 'anonymized'
            user_role: 'admin' | 'user'
        }
    }
}
