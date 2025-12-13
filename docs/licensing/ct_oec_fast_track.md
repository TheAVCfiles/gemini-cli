# Connecticut OEC Fast-Track Licensing Kit

This kit provides the two deliverables requested for accelerating licensing in Fairfield County, Connecticut:

1. **Airtable Licensing Binder + Staff Onboarding Automation**
2. **OEC Pre-Application Packet** (cover email, one-page briefing, and evidence checklist)

The resources below are ready for copy/paste into Airtable, DocuSign, Typeform/Jotform, and PDF exports. They are structured for quick deployment and notarization workflows.

---

## 1. Airtable Licensing Binder & Staff Onboarding Automation

### 1.1 Airtable base structure

Create a base titled **“CT Licensing Binder”** with the following tables, fields, and sample records.

#### Table: `Documents`
| Field | Type | Description | Sample |
| --- | --- | --- | --- |
| `Document ID` | Autonumber | Unique reference used in communications (e.g., `DOC-001`). | `DOC-001` |
| `Title` | Single line text | Short name of the document. | Parent Handbook |
| `Category` | Single select (`Organizational`, `Program`, `Staff Credential`, `Health & Safety`, `Facility`, `Third-Party Proof`, `Administrative`, `Inspection Evidence`) | Organizes evidence by licensing requirement. | Program |
| `Applies To` | Linked record → `Staff` and `Facilities` | Connect documents to relevant people/rooms. | `Patricia Reyes`, `Infant Room` |
| `Status` | Single select (`Draft`, `Review`, `Final`, `Notarized`, `Submitted`) | Track completion. | Notarized |
| `SHA-256 Hash` | Long text | Paste the hash output for tamper evidence. | `b3b8…` |
| `Notarization URL` | URL | Link to Notarize.com transcript or uploaded certificate. | `https://app.notarize.com/...` |
| `File Upload` | Attachment | Store the PDF/doc. | `parent_handbook.pdf` |
| `Notes` | Long text | Include inspector feedback or revision needs. | `Updated safe sleep policy 2024-05-04.` |

#### Table: `Staff`
| Field | Type | Description |
| --- | --- | --- |
| `Staff ID` | Autonumber |
| `Full Name` | Single line text |
| `Role` | Single select (`Director`, `Lead Teacher`, `Assistant Teacher`, `Floater`, `Volunteer`, `Sponsor Rep`)
| `Status` | Single select (`Prospect`, `Offer Sent`, `Pre-Hire`, `Cleared`, `Active`)
| `Background Check Submitted` | Checkbox
| `Fingerprint Confirmation #` | Single line text
| `Background Check Expiration` | Date |
| `CPR/First Aid Expiration` | Date |
| `Mandated Reporter Completed` | Checkbox |
| `Onboarding Packet` | Attachment (DocuSign completion certificate) |
| `Notes` | Long text |

Automation: when `Status` changes to `Pre-Hire`, send Typeform intake link; when `Background Check Submitted` unchecked after 7 days, send reminder (see §1.3).

#### Table: `Facilities`
| Field | Type | Description |
| --- | --- | --- |
| `Facility ID` | Autonumber |
| `Zone` | Single select (`Infant`, `Toddler`, `Preschool`, `Multi-Purpose`, `Outdoor`) |
| `Room Name` | Single line text |
| `Square Footage` | Number (precision 0) |
| `Max Capacity` | Formula (`FLOOR({Square Footage} / 35)`) |
| `Inspection Status` | Single select (`Pending`, `Walkthrough Complete`, `Corrective Action`, `Ready`) |
| `Latest Inspection Date` | Date |
| `Notes` | Long text |

#### Table: `Inspections`
| Field | Type | Description |
| --- | --- | --- |
| `Inspection ID` | Autonumber |
| `Type` | Single select (`Fire`, `Building`, `Health`, `OEC Program`, `Virtual Pre-Check`) |
| `Scheduled Date` | Date |
| `Inspector Name/Contact` | Single line text |
| `Related Facility` | Linked record → `Facilities` |
| `Status` | Single select (`Requested`, `Scheduled`, `Completed`, `Follow-Up Needed`) |
| `Notes` | Long text |
| `Evidence` | Linked records → `Documents` |

#### Table: `Tasks`
| Field | Type | Description |
| --- | --- | --- |
| `Task` | Single line text |
| `Owner` | Collaborator |
| `Due Date` | Date |
| `Category` | Single select (`Licensing`, `Staffing`, `Facilities`, `Inspections`) |
| `Status` | Single select (`Not Started`, `In Progress`, `Waiting`, `Done`) |
| `Linked Records` | Linked to `Documents`, `Staff`, `Inspections` |
| `Notes` | Long text |

#### Table: `Communications`
| Field | Type | Description |
| --- | --- | --- |
| `Comm ID` | Autonumber |
| `Audience` | Single select (`OEC`, `Town Planner`, `Fire Marshal`, `Sponsor`, `Families`) |
| `Subject` | Single line text |
| `Date Sent` | Date |
| `Follow-Up Date` | Date |
| `Channel` | Single select (`Email`, `Phone`, `Meeting`, `Zoom`) |
| `Outcome` | Long text |

### 1.2 Typeform/Jotform intake form (staff onboarding)

**Form title:** `Sentient Village Staff Onboarding`

**Sections & fields:**
1. *Contact Info*
   * Full name (Short text)
   * Preferred email
   * Mobile number
2. *Employment Basics*
   * Position applying for (Dropdown using Airtable role list)
   * Earliest start date (Date)
   * Resume upload (File upload)
3. *Credential Snapshot*
   * Highest education (Dropdown)
   * ECE Credits / CDA (Short text)
   * CPR/First Aid status (Yes/No + expiration date if yes)
   * Mandated Reporter training completed? (Yes/No)
4. *Background Check Authorization*
   * Checkbox consent: “I authorize Sentient Village to submit my information for CT OEC-required fingerprint and background checks.”
   * Signature block (Typeform signature field)
5. *Emergency Contact*
   * Name, relationship, phone
6. *Attachments*
   * Upload certifications (multiple files)

**Integration:**
* Connect to Airtable `Staff` table using the Typeform → Airtable integration. Map fields to the matching columns. Create a new record per submission.

### 1.3 Automations (Zapier examples)

1. **Typeform submission → Airtable + DocuSign packet**
   * *Trigger:* Typeform submission.
   * *Actions:*
     1. Create/update Airtable record in `Staff` with form data.
     2. Send DocuSign envelope using template `Staff Onboarding Packet` (see §1.4). Include fields for W-9, I-9, employee handbook acknowledgment, and health disclosure.
     3. Post to Slack channel `#licensing-ops`: “New staff submission: {{name}} ({{role}}). DocuSign packet sent.”

2. **Airtable status reminder**
   * *Trigger:* Airtable record where `Status = Pre-Hire` AND `Background Check Submitted = unchecked` for 7 days.
   * *Actions:* Send SMS via Twilio to operations lead: “Reminder: {{name}} background check not initiated.”

3. **Document notarization update**
   * *Trigger:* Airtable record in `Documents` where `Status` changes to `Notarized`.
   * *Actions:* Email CT OEC licensing contact with a templated message including document title, hash, and link.

### 1.4 DocuSign packet configuration

*Template name:* `Sentient Village - Staff Onboarding`

*Roles:* `Staff Member (Needs to Sign)`, `Operations Lead (Receives Copy)`

*Documents inside the envelope:*
1. `Employment Agreement` (merge fields for name, role, start date, pay rate)
2. `CT OEC Background Check Authorization`
3. `Mandated Reporter Acknowledgment`
4. `Handbook Receipt`

*Tabs & routing:*
* Staff member fills in SSN, DOB (keep secure; enable ID check if desired), signs each document, uploads government ID.
* Upon completion, DocuSign sends final PDF to Airtable via Zapier (attach to `Staff` record) and to secure drive (Google Drive / SharePoint).

### 1.5 Hashing & notarization workflow

Use the following script to hash documents before uploading to Airtable.

```bash
shasum -a 256 path/to/document.pdf
```

Paste the resulting hash into the `SHA-256 Hash` field. For notarized documents, store the certificate PDF in the `File Upload` field and link the live verification URL in `Notarization URL`.

---

## 2. OEC Pre-Application Packet

This packet contains:
1. Cover email template
2. One-page concept brief
3. Evidence checklist aligned with CT OEC requirements

### 2.1 Cover email template

**Subject:** `Pre-Licensing Consultation Request – Sentient Village Child Development Center`

**Body:**
```
Hello [Licensing Specialist Name],

My name is [Your Name], and I lead Sentient Village, an early learning collective serving Fairfield County families. We are preparing a phased licensing plan and would appreciate a pre-licensing consultation with CT OEC.

Highlights:
• Program model: Infant, toddler, and preschool pods integrated with STEAM, movement, and family enrichment.
• Location: [Site address], currently under [lease/LOI] with targeted opening capacity of [XX] children.
• Readiness: Licensing binder assembled with notarized core documents, background checks initiated for leadership team, and municipal pre-application meetings scheduled.
• Interim operations: We plan to operate a family child care / after-school pilot under sponsor [Sponsor Name] while the full center license is processed.

We would like to discuss:
1. Confirmation of required submissions for both the family child care pilot and the child day care center license.
2. Availability of provisional or phased approvals once inspections are substantially complete.
3. Any site-specific considerations you recommend we resolve before formal submission.

Attached is our one-page concept brief and evidence index. Please let us know available meeting times in the next two weeks. We can accommodate phone or virtual meetings and will share our Airtable binder view in advance.

Thank you for your guidance and partnership in expanding high-quality care in Fairfield County.

Best regards,
[Your Name]
Founder, Sentient Village
[Phone]
[Email]
```

**Attachments:**
* `Sentient_Village_Concept_Brief.pdf`
* `Sentient_Village_Evidence_Index.pdf`

### 2.2 One-page concept brief (content)

Use the following text for a one-page (letter-size) document. Style with your branding; include photos/renderings if available.

**Header:** Sentient Village – Fast-Track Early Learning Hub

**Mission Statement:** “Deliver joyful, culturally grounded, and tech-enabled early childhood experiences that empower families and educators.”

**Program Snapshot:**
* Age groups: Infant (6 weeks+), Toddler, Preschool, After-School Enrichment
* Capacity goal: 72 children (center) + 12 pilot slots under family child care/sponsor
* Hours: 7:30 a.m.–6:00 p.m., year-round, with extended care and weekend enrichment pods
* Curriculum pillars: STEAM ateliers, movement & dance, nature/farm partnerships, family financial literacy (Sentient Cents)

**Facility Overview:**
* Address: [Insert address]
* 6 classrooms (infant, toddler, preschool) + multi-use atelier and wellness room
* Dedicated outdoor play yard (3,200 sq. ft.) with impact-rated surfacing and shade
* Secure entry with digital check-in, camera coverage, and emergency alert integration

**Staff Leadership:**
* Program Director: [Name], M.Ed., former CT center director with 10+ years’ licensing experience
* Curriculum Lead: [Name], Reggio-inspired educator & STEAM specialist
* Operations/Family Services: [Name], finance & enrollment lead leveraging Sentient Cents platform

**Community & Equity Commitments:**
* 30% of seats reserved for sliding-scale scholarships
* Partnership LOIs with [Local School], [Community College], and [Sponsor Provider]
* Parent advisory council + local workforce pipeline apprenticeships

**Licensing Readiness:**
* Digital binder of notarized documents (organizational, staffing, health/safety)
* Background checks initiated for leadership team (fingerprint appointments scheduled)
* Fire/building pre-walk completed; corrective actions underway with contractors
* Sponsor agreement drafted for interim pilot operations

**Request:** Schedule CT OEC pre-licensing consultation; confirm provisional and phased licensing pathways.

### 2.3 Evidence index (checklist)

Create a two-column PDF/Excel using the structure below. The `Document ID` references Airtable records.

| Category | Requirement | Document ID | Status |
| --- | --- | --- | --- |
| Organizational | Business entity documents (Articles, EIN confirmation) | DOC-001, DOC-002 | Final |
| Organizational | Board roster / management agreement | DOC-003 | Notarized |
| Program | Parent & staff handbooks | DOC-010, DOC-011 | Final |
| Program | Daily schedules by age group | DOC-012 | Review |
| Program | Curriculum overview & assessment plan | DOC-013 | Final |
| Staff Credential | Director credentials (degree, resume) | DOC-020 | Notarized |
| Staff Credential | Lead teacher qualifications & CPR/First Aid | DOC-021 to DOC-025 | In Progress |
| Staff Credential | Background check confirmations | DOC-030 series | Pending |
| Health & Safety | Emergency preparedness plan | DOC-040 | Notarized |
| Health & Safety | Medication & health policies | DOC-041 | Final |
| Facility | Floor plans w/ square footage & capacity calc | DOC-050 | Review |
| Facility | Fire & building pre-inspection notes | DOC-051 | Draft |
| Facility | Outdoor play compliance photos (hashed) | DOC-052 | Draft |
| Third-Party Proof | Insurance binder | DOC-060 | Pending |
| Third-Party Proof | Lease/LOI notarized | DOC-061 | Notarized |
| Administrative | Enrollment, attendance, incident templates | DOC-070 to DOC-072 | Final |
| Administrative | Sponsor agreement (pilot) | DOC-073 | Draft |
| Inspections | Virtual pre-inspection video link & transcript | DOC-080 | Planned |

Export this table as `Sentient_Village_Evidence_Index.pdf` directly from Airtable (Grid view → Print view).

---

### 2.4 Town planner meeting packet (optional add-on)

For municipal pre-application meetings, provide:
* Cover memo summarizing program benefits and traffic/parking overview
* Site plan exhibit with labeled drop-off zones
* Letters of support or MOUs (upload to `Documents` and reference IDs)

---

## 3. Deployment checklist (next 48 hours)

1. **Duplicate this structure** into Airtable; import any existing documents and assign Document IDs.
2. **Publish the Typeform** and connect to Zapier + Airtable.
3. **Upload DocuSign templates** and test the automation with an internal staff member.
4. **Generate the concept brief** using provided copy; export as PDF and add Document IDs (`DOC-090` for the brief, `DOC-091` for the evidence index).
5. **Send the cover email** to CT OEC once the brief and evidence index PDFs are attached and the Airtable binder is populated.

This package demonstrates operational readiness, accelerates inspections, and keeps regulators updated through shareable digital evidence.
