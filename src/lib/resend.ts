/**
 * @author SaltedFish-No1
 * @description Resend 邮件客户端单例，仅用于服务端 API Route Handler。
 */

import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
