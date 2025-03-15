import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from '../user/models/user.models';

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) { };

    async sendUserConfirmation(user: User, token: string): Promise<void> {
        const url = `${process.env.API_HOST}/verify-email?activation_link=${token}`;
        const data = await this.mailerService.sendMail({
            to: user.email,
            subject: "Welcome to IlmNur App! Confirm your email!",
            template: './confirmation',
            context: {
                name: user.name + ' ' + user.surname,
                url,
            },
        });

        console.log(data);
    };

    async sendUserActivationLink(activation_link: string, email: string): Promise<void> {
        const url = `${process.env.API_HOST}/change-password?activation_link=${activation_link}`;
        const data = await this.mailerService.sendMail({
            to: email,
            subject: "Reset your IlmNur password",
            template: './reset-password',
            context: {
                // name: user.name + ' ' + user.surname,
                url,
            },
        });

        console.log(data);
    };
}