/**
 * Equal Scales — Template Service
 *
 * Scans the local templates directory, parses frontmatter metadata,
 * and syncs template records to SQLite. Also provides template retrieval
 * with full body content for the clone/fill workflow.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { TEMPLATES_DIR } from '../storage/paths.js';
import {
  createTemplate,
  getTemplateById,
  getTemplateBySlug,
  listTemplates,
  updateTemplate
} from '../storage/repositories/templates.js';
import { getDb } from '../storage/db.js';

/**
 * Scan the templates directory and sync all .md templates to the database.
 * Idempotent: updates existing records, inserts new ones.
 */
function syncTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.log('[Templates] Templates directory does not exist:', TEMPLATES_DIR);
    return [];
  }

  const synced = [];
  const categories = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const category of categories) {
    const categoryDir = path.join(TEMPLATES_DIR, category);
    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      try {
        const template = parseTemplateFile(filePath);
        if (!template) continue;

        // Look up by slug first, then by source_path (handles slug renames)
        let existing = getTemplateBySlug(template.slug);
        if (!existing) {
          existing = getDb().prepare('SELECT * FROM templates WHERE source_path = ?').get(filePath) || null;
        }
        if (existing) {
          updateTemplate(existing.id, {
            name: template.name,
            template_type: template.template_type,
            description: template.description,
            file_format: template.format,
            source_path: filePath,
            placeholders: template.placeholders,
            tags: template.tags
          });
          // Update slug if it changed
          if (existing.slug !== template.slug) {
            getDb().prepare("UPDATE templates SET slug = ?, updated_at = datetime('now') WHERE id = ?")
              .run(template.slug, existing.id);
          }
          synced.push({ slug: template.slug, action: 'updated' });
        } else {
          createTemplate({
            slug: template.slug,
            name: template.name,
            templateType: template.template_type,
            description: template.description,
            fileFormat: template.format || 'markdown',
            sourcePath: filePath,
            placeholders: template.placeholders || [],
            tags: template.tags || []
          });
          synced.push({ slug: template.slug, action: 'created' });
        }
      } catch (err) {
        console.error(`[Templates] Failed to parse ${filePath}:`, err.message);
      }
    }
  }

  // Purge DB rows whose source files no longer exist
  const allDbTemplates = listTemplates();
  let purged = 0;
  for (const tmpl of allDbTemplates) {
    if (!fs.existsSync(tmpl.source_path)) {
      getDb().prepare('DELETE FROM templates WHERE id = ?').run(tmpl.id);
      purged++;
      console.log('[Templates] Purged stale template:', tmpl.slug, '(file missing:', tmpl.source_path, ')');
    }
  }

  console.log(`[Templates] Synced ${synced.length} templates from ${categories.length} categories` +
    (purged > 0 ? `, purged ${purged} stale` : ''));
  return synced;
}

/**
 * Parse a markdown template file with YAML frontmatter.
 * Returns metadata object or null if invalid.
 */
function parseTemplateFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  if (!data.name || !data.slug) {
    console.warn(`[Templates] Skipping ${filePath}: missing required frontmatter (name, slug)`);
    return null;
  }

  return {
    slug: data.slug,
    name: data.name,
    template_type: data.template_type || null,
    description: data.description || null,
    format: data.format || 'markdown',
    placeholders: data.placeholders || [],
    tags: data.tags || [],
    body: content.trim()
  };
}

/**
 * Get a template's full content (metadata + body) by ID.
 */
function getTemplateWithBody(templateId) {
  const record = getTemplateById(templateId);
  if (!record) return null;

  if (!fs.existsSync(record.source_path)) {
    console.error('[Templates] Template file missing:', record.source_path);
    return { ...record, body: null };
  }

  const raw = fs.readFileSync(record.source_path, 'utf-8');
  const { content } = matter(raw);

  return {
    ...record,
    body: content.trim()
  };
}

/**
 * Initialize the template library with category directories and
 * standard legal templates if the library is empty.
 */
function seedDefaultTemplates() {
  const categories = ['estate', 'litigation', 'contracts', 'intake', 'client-communications'];

  for (const cat of categories) {
    const dir = path.join(TEMPLATES_DIR, cat);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Only seed if no templates exist yet
  const existingFiles = categories.flatMap(cat => {
    const dir = path.join(TEMPLATES_DIR, cat);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')) : [];
  });

  if (existingFiles.length > 0) {
    console.log('[Templates] Templates already exist, skipping seed');
    return;
  }

  const templates = [
    {
      category: 'estate',
      filename: 'simple-will.md',
      content: `---
name: Simple Will
slug: simple-will
template_type: estate
description: A basic last will and testament template for simple estates.
placeholders:
  - client_full_name
  - client_address
  - executor_name
  - executor_address
  - beneficiaries
  - specific_bequests
tags:
  - will
  - estate-planning
  - probate
---

# Last Will and Testament of {{client_full_name}}

I, **{{client_full_name}}**, of {{client_address}}, being of sound mind and memory, do hereby declare this to be my Last Will and Testament, revoking all prior wills and codicils.

## Article I — Identification

I am {{client_full_name}}, residing at {{client_address}}.

## Article II — Appointment of Executor

I appoint **{{executor_name}}**, of {{executor_address}}, as the Executor of this Will.

If {{executor_name}} is unable or unwilling to serve, I appoint **[REVIEW REQUIRED: Alternate Executor]** as alternate Executor.

## Article III — Debts and Expenses

I direct my Executor to pay all legally enforceable debts, funeral expenses, and costs of administration from my estate.

## Article IV — Specific Bequests

[[SECTION:SPECIFIC_BEQUESTS]]
_The following specific bequests are made:_

{{specific_bequests}}

[[/SECTION:SPECIFIC_BEQUESTS]]

## Article V — Residuary Estate

[[SECTION:BENEFICIARIES]]
I give, devise, and bequeath the rest, residue, and remainder of my estate to the following beneficiaries:

{{beneficiaries}}

[[/SECTION:BENEFICIARIES]]

## Article VI — General Provisions

- If any beneficiary predeceases me, their share shall pass to their surviving descendants per stirpes, or if none, to the remaining beneficiaries in equal shares.
- My Executor shall have full power to sell, lease, or otherwise manage estate property as necessary.

## Article VII — Signature

IN WITNESS WHEREOF, I have signed this Will on this ___ day of ___________, 20___.

\\
**{{client_full_name}}**
Testator

### Witnesses

Signed in our presence by the Testator, who declared this to be their Last Will and Testament:

1. Witness Name: _________________________ | Address: _________________________ | Signature: _________________________
2. Witness Name: _________________________ | Address: _________________________ | Signature: _________________________
`
    },
    {
      category: 'litigation',
      filename: 'demand-letter.md',
      content: `---
name: Demand Letter
slug: demand-letter
template_type: litigation
description: A formal demand letter template for pre-litigation disputes.
placeholders:
  - client_full_name
  - client_address
  - recipient_name
  - recipient_address
  - demand_amount
  - incident_date
  - response_deadline
tags:
  - demand
  - dispute
  - pre-litigation
---

# Demand Letter

**Date:** [DATE]

**Via Certified Mail — Return Receipt Requested**

{{recipient_name}}
{{recipient_address}}

**Re: Demand for Payment — {{client_full_name}}**

Dear {{recipient_name}}:

This firm represents **{{client_full_name}}** regarding the matter described below.

## Statement of Facts

[[SECTION:FACTS]]
On or about {{incident_date}}, the following events occurred:

_[Describe the relevant facts and circumstances giving rise to this claim.]_

[[/SECTION:FACTS]]

## Legal Basis

[[SECTION:LEGAL_BASIS]]
_[Describe the legal theories supporting the claim — breach of contract, negligence, statutory violation, etc.]_

[[/SECTION:LEGAL_BASIS]]

## Demand

Based on the foregoing, our client demands payment of **{{demand_amount}}** to fully resolve this matter. This amount represents:

- _[Itemize damages: actual damages, consequential damages, statutory damages, etc.]_

## Response Required

Please respond to this demand in writing no later than **{{response_deadline}}**. If we do not receive a satisfactory response by that date, our client is prepared to pursue all available legal remedies, including filing a civil action, without further notice.

All rights and remedies are expressly reserved.

Sincerely,

\\
**[Attorney Name]**
[Firm Name]
[Address]
[Phone]
[Email]

cc: {{client_full_name}}
`
    },
    {
      category: 'contracts',
      filename: 'engagement-letter.md',
      content: `---
name: Engagement Letter
slug: engagement-letter
template_type: contracts
description: Standard attorney-client engagement letter template.
placeholders:
  - client_full_name
  - client_address
  - matter_description
  - fee_arrangement
  - retainer_amount
tags:
  - engagement
  - retainer
  - fee-agreement
---

# Attorney-Client Engagement Letter

**Date:** [DATE]

{{client_full_name}}
{{client_address}}

**Re: Engagement of Legal Services**

Dear {{client_full_name}}:

Thank you for selecting our firm to represent you. This letter sets forth the terms and conditions of our engagement.

## Scope of Representation

[[SECTION:SCOPE]]
We have agreed to represent you in connection with the following matter:

{{matter_description}}

Our representation is limited to the above-described matter unless we agree in writing to expand the scope.

[[/SECTION:SCOPE]]

## Fee Arrangement

[[SECTION:FEES]]
{{fee_arrangement}}

[[/SECTION:FEES]]

## Retainer

A retainer of **{{retainer_amount}}** is required to initiate representation. This retainer will be deposited in our client trust account and applied against fees and costs as they are incurred.

## Client Responsibilities

You agree to:
- Provide truthful and complete information relevant to your matter
- Respond promptly to communications from our office
- Keep us informed of any changes in your contact information

## Termination

Either party may terminate this engagement at any time upon written notice. Upon termination, you will remain responsible for fees and costs incurred to that point.

## Acceptance

If you agree to these terms, please sign and return a copy of this letter along with the retainer.

Sincerely,

\\
**[Attorney Name]**
[Firm Name]

---

**ACCEPTED AND AGREED:**

Signature: _________________________

Printed Name: {{client_full_name}}

Date: _________________________
`
    },
    {
      category: 'intake',
      filename: 'client-intake-checklist.md',
      content: `---
name: Client Intake Checklist
slug: client-intake-checklist
template_type: intake
description: Standard new client intake checklist and information gathering form.
placeholders:
  - client_full_name
  - client_address
  - client_phone
  - client_email
  - matter_type
tags:
  - intake
  - new-client
  - checklist
---

# Client Intake Checklist

## Client Information

- **Full Legal Name:** {{client_full_name}}
- **Address:** {{client_address}}
- **Phone:** {{client_phone}}
- **Email:** {{client_email}}
- **Date of Birth:** [DOB]
- **SSN (last 4):** [SSN]

## Matter Information

- **Type of Matter:** {{matter_type}}
- **Referred By:** [REFERRAL SOURCE]
- **Statute of Limitations Date:** [SOL DATE — REVIEW REQUIRED]

## Conflict Check

- [ ] Conflict check completed
- [ ] No conflicts identified
- [ ] Conflict waiver obtained (if applicable)

## Documents Received

- [ ] Photo identification
- [ ] Prior legal documents (if any)
- [ ] Relevant correspondence
- [ ] Contracts or agreements
- [ ] Court filings (if any)

## Initial Assessment

[[SECTION:ASSESSMENT]]
_Summary of initial consultation and preliminary legal assessment:_

[REVIEW REQUIRED]

[[/SECTION:ASSESSMENT]]

## Next Steps

- [ ] Engagement letter sent
- [ ] Retainer collected
- [ ] File opened
- [ ] Calendar deadlines set
`
    },
    {
      category: 'client-communications',
      filename: 'status-update-letter.md',
      content: `---
name: Status Update Letter
slug: status-update-letter
template_type: client-communications
description: Template for sending matter status updates to clients.
placeholders:
  - client_full_name
  - client_address
  - matter_description
tags:
  - communication
  - status-update
  - client-letter
---

# Status Update

**Date:** [DATE]

{{client_full_name}}
{{client_address}}

**Re: {{matter_description}} — Status Update**

Dear {{client_full_name}}:

I am writing to provide you with an update on the status of your matter.

## Current Status

[[SECTION:STATUS]]
_[Describe the current status of the matter, recent developments, and actions taken.]_

[[/SECTION:STATUS]]

## Next Steps

[[SECTION:NEXT_STEPS]]
_[Describe upcoming actions, deadlines, and what the client should expect.]_

[[/SECTION:NEXT_STEPS]]

## Action Items for Client

- _[List any items requiring client action or response.]_

Please do not hesitate to contact our office if you have any questions or concerns.

Sincerely,

\\
**[Attorney Name]**
[Firm Name]
[Phone]
[Email]
`
    }
  ];

  for (const tmpl of templates) {
    const filePath = path.join(TEMPLATES_DIR, tmpl.category, tmpl.filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, tmpl.content, 'utf-8');
      console.log('[Templates] Added to library:', tmpl.filename);
    }
  }
}

export { syncTemplates, parseTemplateFile, getTemplateWithBody, seedDefaultTemplates };
