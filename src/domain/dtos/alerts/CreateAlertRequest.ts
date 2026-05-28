import { AlertCondition } from "../../valueObjects/AlertCondition";

export interface CreateAlertRequest {
    userID: string,
    productUrl: string,
    condition: AlertCondition,
}