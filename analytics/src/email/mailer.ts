export interface OutboundEmail {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export interface TransactionalEmailService {
  send(email: OutboundEmail): void;
  sent: OutboundEmail[];
}

export function createTransactionalEmailService(): TransactionalEmailService {
  const sent: OutboundEmail[] = [];
  return {
    sent,
    send(email) {
      sent.push({ ...email, to: [...email.to] });
    },
  };
}

export const mailer = createTransactionalEmailService();
