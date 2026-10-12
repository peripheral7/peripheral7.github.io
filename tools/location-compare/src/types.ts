export type Home = {
 id:number; name:string; address:string; lat:number; lng:number; transport:number; commerce:number; park:number; public:number; overall:number; selected:boolean;
 transport_reason:string; commerce_reason:string; park_reason:string; public_reason:string
}
export type Hub = { id:number; name:string; address:string; lat:number; lng:number; category:string }
export type TransitPoi = { id:number; result:string; count:string; station:string; stationClass:string; stationName:string; stationID:string; type:string; laneName:string; laneCity:string; stationType:string; x:string; y:string; arsID:string; ebid:string; busOnlyCentralLane:string; error:string; code:string; message:string; has_location:boolean }
export type MobilityPreference = { primary_modes:string[]; secondary_modes:string[]; transit_weight:number; car_weight:number; active_weight:number; transit_priority_hub_ids:number[]; hub_monthly_roundtrips:Record<string, number>; hub_weight_multipliers:Record<string, number> }
export type RouteSummary = { hub_id:number; hub_name:string; hub_address:string; hub_lat:number; hub_lng:number; category:string; monthly_roundtrips:number; calculation_weight:number; hub_weight_multiplier:number; distance_km:number; transit_minutes:number; transit_score:number; accessibility_score:number; score_basis:string; transit_mode:string; transit_detail:string; wait_minutes:number; transfer_count:number; station_access_minutes:number; score_deviation:number; proximity_highlights:string[]; car_rush_minutes:number; car_day_minutes:number; walk_minutes:number|null; bike_minutes:number|null }
export type BusRoute = { id:number; opr_ymd:string; ctpv_cd:string; rte_id:string; rte_no:string; rte_nm:string }
