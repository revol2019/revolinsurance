/**
 * Agency details. Single source of truth — the footer, the legal pages and the
 * lead emails all read from here, so a change lands everywhere at once.
 */

export const AGENCY = {
  legalName: 'REVOL Financial Group, LLC',
  tradeName: 'REVOL Insurance',
  email: 'info@revolfg.com',
  phone: '443-275-5533',
  /** Digits only, for tel: links. */
  phoneHref: '+14432755533',
  address: {
    line1: '1850 York Road, Ste I',
    city: 'Timonium',
    state: 'MD',
    zip: '21093',
  },
} as const;

export const ADDRESS_LINES = [
  AGENCY.address.line1,
  `${AGENCY.address.city}, ${AGENCY.address.state} ${AGENCY.address.zip}`,
];
