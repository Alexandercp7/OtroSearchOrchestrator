import { CreateAlertRequest } from "../dtos/alerts/CreateAlertRequest";
import { Alert } from "../entities/Alert";
import { IdGenerator } from "../interfaces/gateways/IdGenerator";
import { AlertRepository } from "../interfaces/repositories/AlertRepository";

export class AlertCreation {
    constructor(
        private readonly alerts: AlertRepository,
        private readonly ids: IdGenerator,
    ) {}

    async create(request: CreateAlertRequest): Promise<Alert> {
        const alert = new Alert(
            this.ids.generate(),
            request.userID,
            request.productUrl,
            request.condition,
            true,
            null
         );
        await this.alerts.save(alert);
        return alert;
    }
}