export interface Email {
  id: string;
  from: string;
  subject: string;
  /** Use \n for line breaks and \n\n between paragraphs. */
  body: string;
  /** Small sender picture in the Inbox list (pixel art). */
  icon?: string;
  /** Logo shown at the top of the opened email (pixel art). */
  logo?: string;
}

/** Emails in Finn's Inbox. */
export const emails: Email[] = [
  {
    id: 'vaulton-acceptance',
    from: 'Vaulton',
    icon: 'assets/vaulton_icon.png',
    logo: 'assets/vaulton_logo.png',
    subject: 'Congratulations!',
    body:
      'Dear Finn,\n\n' +
      'We are pleased to offer you a place in the Vaulton Summer Internship Program.\n\n' +
      'Each year, only a few applicants from across Cashtropolis are chosen. You stood out as a candidate of high potential.\n\n' +
      'Details about your first day will follow soon. We look forward to building tomorrow together.\n\n' +
      'Trust Us With Tomorrow.\n\n' +
      '- The Vaulton Internship Team',
  },
];
