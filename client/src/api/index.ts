import { BASE_URL } from "./config";
import { customFetch } from "./customFetch";
import {
    AuthClient,
    WindmillWebClient,
    RealtimeSubscriptionsClient,
} from "../generated-ts-client";

export const api = {
    auth: new AuthClient(BASE_URL, customFetch),
    windmills: new WindmillWebClient(BASE_URL, customFetch),
    realtime: new RealtimeSubscriptionsClient(BASE_URL, customFetch),
};