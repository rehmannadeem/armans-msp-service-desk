// Fixed, synthetic demo identities and organizations. These are NOT real
// customer data (see BUILD_SPEC.md "Do not present synthetic runbooks or
// demo identities as real customer data") — every email uses a `.local`/
// `-demo` domain and every id is a hand-picked constant so db/seed.ts and
// the login screen (lib/auth/demo-users.ts) always agree on identity.
//
// Two organizations exist specifically to prove tenant isolation: Northgate
// has a deliberately smaller knowledge base so some ticket categories there
// correctly produce NO_APPROVED_GUIDANCE even though Riverside has coverage.

import type { Organization, Role } from "./types";

export const ORG_RIVERSIDE: Organization = {
  id: "11111111-1111-4111-8111-111111111101",
  name: "Riverside MSP",
  slug: "riverside-msp",
};

export const ORG_NORTHGATE: Organization = {
  id: "11111111-1111-4111-8111-111111111102",
  name: "Northgate IT Partners",
  slug: "northgate-it",
};

export const ORGANIZATIONS: Organization[] = [ORG_RIVERSIDE, ORG_NORTHGATE];

export interface DemoUserFixture {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
}

export const DEMO_USERS: DemoUserFixture[] = [
  // Riverside MSP
  {
    id: "22222222-2222-4222-8222-222222222201",
    organizationId: ORG_RIVERSIDE.id,
    email: "dana.customer@riverside-demo.local",
    fullName: "Dana Ruiz",
    role: "customer",
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    organizationId: ORG_RIVERSIDE.id,
    email: "priya.dispatcher@riverside-demo.local",
    fullName: "Priya Shah",
    role: "dispatcher",
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    organizationId: ORG_RIVERSIDE.id,
    email: "leo.l1@riverside-demo.local",
    fullName: "Leo Martin",
    role: "l1_technician",
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    organizationId: ORG_RIVERSIDE.id,
    email: "sam.l2@riverside-demo.local",
    fullName: "Sam Okafor",
    role: "l2_technician",
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    organizationId: ORG_RIVERSIDE.id,
    email: "morgan.manager@riverside-demo.local",
    fullName: "Morgan Lee",
    role: "service_manager",
  },
  // Northgate IT Partners
  {
    id: "22222222-2222-4222-8222-222222222206",
    organizationId: ORG_NORTHGATE.id,
    email: "casey.customer@northgate-demo.local",
    fullName: "Casey Kim",
    role: "customer",
  },
  {
    id: "22222222-2222-4222-8222-222222222207",
    organizationId: ORG_NORTHGATE.id,
    email: "jordan.dispatcher@northgate-demo.local",
    fullName: "Jordan Blake",
    role: "dispatcher",
  },
  {
    id: "22222222-2222-4222-8222-222222222208",
    organizationId: ORG_NORTHGATE.id,
    email: "ari.l1@northgate-demo.local",
    fullName: "Ari Novak",
    role: "l1_technician",
  },
  {
    id: "22222222-2222-4222-8222-222222222209",
    organizationId: ORG_NORTHGATE.id,
    email: "quinn.l2@northgate-demo.local",
    fullName: "Quinn Alvarez",
    role: "l2_technician",
  },
  {
    id: "22222222-2222-4222-8222-222222222210",
    organizationId: ORG_NORTHGATE.id,
    email: "taylor.manager@northgate-demo.local",
    fullName: "Taylor Brooks",
    role: "service_manager",
  },
];

export function demoUsersForOrg(organizationId: string): DemoUserFixture[] {
  return DEMO_USERS.filter((u) => u.organizationId === organizationId);
}

export function findDemoUser(id: string): DemoUserFixture | undefined {
  return DEMO_USERS.find((u) => u.id === id);
}
