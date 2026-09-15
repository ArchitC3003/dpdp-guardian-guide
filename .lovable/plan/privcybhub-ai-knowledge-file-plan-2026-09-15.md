# PrivcybHub AI Knowledge File Plan

## Goal

Create one downloadable Markdown file that gives an external AI an accurate, end-to-end understanding of PrivcybHub’s website, application functions, technical capabilities, and present implementation status.

The document will contain facts only. It will not include chatbot tone, prompting, or response-behaviour instructions.

## What the file will cover

1. **Product identity and scope**
   - PrivcybHub purpose, target users, supported compliance areas, public URLs, and terminology.

2. **Access and roles**
   - Public versus signed-in areas.
   - Super Admin, GRC Manager, Reviewer, and Auditor permissions in a clear matrix.
   - Organisation isolation and session controls.

3. **Complete function and navigation inventory**
   - Public website, authentication, onboarding, dashboard, settings, and user management.
   - Assess module and its six-phase assessment workflow.
   - Department Practice Grid and departmental questionnaires.
   - Build module: policy generation, policy register, templates, clauses, versions, exports, and document repository.
   - Execute module: industry sunburst, organisation profile, triggered flags, regulatory crosswalk, and programme workspace.
   - Privacy Operations: consent, notices, rights requests, grievances, and audit history.
   - Framework, assessment-template, AI, and knowledge-management administration.
   - Public privacy, terms, preference, and unsubscribe functions.

4. **Technical overview**
   - Frontend, Lovable Cloud backend, authentication, database, storage, server functions, email, AI, exports, charts, and security controls.
   - Main data areas and how important workflows connect, without exposing secrets, keys, private identifiers, or sensitive configuration.

5. **Current status register**
   - Label every major capability as **Implemented**, **Implemented with limitations**, **Coming soon**, **Locked**, **Fallback/demo behaviour**, or **Not exposed in navigation**.
   - Record confirmed gaps and inconsistencies, such as functions whose UI status differs across pages.
   - Separate verified working code paths from product intent or future-facing labels.

6. **Reference sections for AI retrieval**
   - Route directory.
   - Feature-to-role matrix.
   - Workflow summaries.
   - Supported frameworks, document types, sectors, exports, and integrations.
   - Glossary and source-file references for traceability.

## Accuracy method

- Audit routes, navigation, role checks, page behaviour, server functions, schema migrations, and active product data represented in the project.
- Cross-check visible “coming soon”, locked, placeholder, mock, and fallback states rather than describing them as complete.
- Use a generated-on date and a clear freshness note so the receiving AI understands this is a point-in-time snapshot.
- Avoid unsupported marketing claims and mark anything that cannot be verified from the current project.

## Deliverable

- Create `/mnt/documents/privcybhub-website-knowledge.md` as a downloadable artifact.
- Structure it for both human reading and AI ingestion using stable headings, concise tables, explicit status labels, and self-contained descriptions.
- Inspect the finished Markdown for completeness, broken structure, accidental secrets, conflicting status statements, and unreadable sections before delivery.

## Scope boundaries

- No website, database, authentication, or application behaviour will be changed.
- No credentials, backend project identifiers, user data, or private environment values will be included.
- This is a current-state knowledge snapshot, not a promise that every planned feature is operational.