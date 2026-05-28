import { AlertCondition } from "../../valueObjects/AlertCondition";

export interface AlertRequest {
    id: string;
    productUrl: string;
    condition: AlertCondition;
    active: boolean;
    lastTriggeredAt: Date | null;
}