import { Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';

@Injectable()
export class MyService {
    // Bu funksiya har kuni soat 00:00da ishga tushadi
    // @Cron('0 0 0 * * *') // Cron ifodasi
    // handleCron() {
    //     console.log('Har kuni soat 00:00da ishlaydi');
    //     // Bu yerda har kuni bajariladigan ishni qo'shing
    // }

    // @Interval(60000) // Har 1 daqiqada ishga tushadi
    // handleInterval() {
    //     console.log('Har 1 daqiqada ishlaydi');
    // }

}
