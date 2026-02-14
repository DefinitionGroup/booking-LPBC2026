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
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    domain?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    domain?: string | null
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'user'
                    company_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'user'
                    company_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'user'
                    company_id?: string | null
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
                    title: string
                    description: string | null
                    start_time: string
                    end_time: string
                    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    recurrence_rule: string | null
                    parent_booking_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    room_id: string
                    user_id: string
                    title: string
                    description?: string | null
                    start_time: string
                    end_time: string
                    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    recurrence_rule?: string | null
                    parent_booking_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string
                    user_id?: string
                    title?: string
                    description?: string | null
                    start_time?: string
                    end_time?: string
                    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
                    recurrence_rule?: string | null
                    parent_booking_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
