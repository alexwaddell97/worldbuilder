# Changelog

## [1.1.0](https://github.com/alexwaddell97/worldbuilder/compare/v1.0.1...v1.1.0) (2026-07-01)


### Features

* **12:** marketing re-design for go-live ([b8708cb](https://github.com/alexwaddell97/worldbuilder/commit/b8708cb27ac95ccd9f9de669b1653af3a6fadf33))

## [1.0.1](https://github.com/alexwaddell97/worldbuilder/compare/v1.0.0...v1.0.1) (2026-06-30)


### Bug Fixes

* release please token added for discord webhook support ([8c053b3](https://github.com/alexwaddell97/worldbuilder/commit/8c053b3a9cc3a3a1bc4ec222ec14851d5eacb00a))

## 1.0.0 (2026-06-30)


### Features

* **01-01:** scaffold Next.js 15, Tailwind v4, shadcn/ui tokens, Geist fonts, Drizzle/Neon scaffold ([4df749d](https://github.com/alexwaddell97/worldbuilder/commit/4df749d959b7fe2cc1c2afa85ccd5e6efe8ae2cb))
* **01-02:** add Drizzle schema (worlds, entity_types) and initial migration ([2645330](https://github.com/alexwaddell97/worldbuilder/commit/2645330231aad21cbed021770ab43603db828e49))
* **01-03:** add Better Auth config, API route, and middleware ([cbf9939](https://github.com/alexwaddell97/worldbuilder/commit/cbf99398742220eae851fb34d9acbc728561eb28))
* **01-04:** add route groups, auth forms, collapsible sidebar, app layout shell ([004520d](https://github.com/alexwaddell97/worldbuilder/commit/004520d435fa8b9b39dba11a3b64984d2ab7d0bf))
* **01-05:** add full landing page (6 sections) and Vercel deployment config ([2aca75a](https://github.com/alexwaddell97/worldbuilder/commit/2aca75a92b596e4f0b846e3d374a6889eb5138ab))
* **02-01:** add Server Actions (create, update, delete, togglePrivacy) with auth + IDOR guards ([cf8afdf](https://github.com/alexwaddell97/worldbuilder/commit/cf8afdf97a019f3f70673f9866f377833a09c7cf))
* **02-01:** add Zod v4 validation schemas and owner-scoped query helpers ([a8705b7](https://github.com/alexwaddell97/worldbuilder/commit/a8705b7b8685d9ac9ff0fb0969ef88e209b952e5))
* **02-01:** migrate worlds.slug to composite (owner_id, slug) unique constraint ([59bc6b2](https://github.com/alexwaddell97/worldbuilder/commit/59bc6b20c4f12d93943654042f335d140f96adc1))
* **02-02:** install 8 shadcn/ui primitives for Phase 2 UI ([c06d013](https://github.com/alexwaddell97/worldbuilder/commit/c06d013908e5da722e457f873de96dc99c9dbc2d))
* **03-01:** add entity type and entity query helpers ([d926d73](https://github.com/alexwaddell97/worldbuilder/commit/d926d73096766d5d1be9ad94b051eba2bd54503f))
* **03-01:** extend schema, add entity type constants and validations ([ad3d38b](https://github.com/alexwaddell97/worldbuilder/commit/ad3d38bec50e2638ef57c0925268d50e52ea9258))
* **03-01:** wrap createWorldAction in transaction, seed entity types, add migration 0003 ([a7c8054](https://github.com/alexwaddell97/worldbuilder/commit/a7c80540277e9ebd6516126e6033750e1a4cb93d))
* **03-02:** add entity server actions (create/update/delete) ([f9ec8e3](https://github.com/alexwaddell97/worldbuilder/commit/f9ec8e3a73d2c79007b471d61c4b37190d62c53b))
* **03-02:** add entity-type server actions (create/update/delete) ([d0d2b37](https://github.com/alexwaddell97/worldbuilder/commit/d0d2b375a10e78e004ec0a14dd65b0f6e9b8ad89))
* **03-02:** add ICON_PICKER_OPTIONS constant with 40 Lucide icon names ([2c3771c](https://github.com/alexwaddell97/worldbuilder/commit/2c3771c737efde3b56651c5900d47ccb6e91171b))
* **03-02:** install shadcn components (select, tabs, scroll-area, tooltip, popover) ([8706fe8](https://github.com/alexwaddell97/worldbuilder/commit/8706fe8460c9fbff8e0d0a7ac1df0f22f635064d))
* **03-03:** add entity type form and CRUD dialogs ([dfae577](https://github.com/alexwaddell97/worldbuilder/commit/dfae577991a877d2a5f246818e22dad036dc57f4))
* **03-03:** add entity types management page and row-actions component ([02473cc](https://github.com/alexwaddell97/worldbuilder/commit/02473cc67598466ac9349089f83547ab6b5b39a8))
* **03-03:** add IconPicker and DynamicIcon components ([1aea928](https://github.com/alexwaddell97/worldbuilder/commit/1aea928669c8da0351bcd8d168238e51b5b5d857))
* **03-03:** update world layout and sidebar with entity type nav links ([eb2cdac](https://github.com/alexwaddell97/worldbuilder/commit/eb2cdac09fcc7e61e8a7124d2442d99154718372))
* **03-04:** add entity custom-fields-form, entity-form, and CRUD dialogs ([dff8054](https://github.com/alexwaddell97/worldbuilder/commit/dff80544956413ac8dcfefcac81c7a2411fd0449))
* **03-04:** add entity detail page and update world overview with entity type nav ([5f9ebff](https://github.com/alexwaddell97/worldbuilder/commit/5f9ebffa8298cc4f0c2813419a163b1747352f12))
* **03-04:** add entity list page with URL-driven search and tag filter ([69fff0b](https://github.com/alexwaddell97/worldbuilder/commit/69fff0b3d64c8fa083afe78425639dad588b0671))
* **03-04:** add EntityCard component ([c4d1abe](https://github.com/alexwaddell97/worldbuilder/commit/c4d1abe133a8eb6ae6805d771355718f01fe4711))
* **04-01:** install Tiptap 3.27.x + data layer ([4ccac55](https://github.com/alexwaddell97/worldbuilder/commit/4ccac554a7aabee03c544aa5b557d670ca7ce056))
* **04-02:** WikilinkExtension + WikilinkNodeView ([e0aa127](https://github.com/alexwaddell97/worldbuilder/commit/e0aa127b8c78e079779e9634b57877fce1e8b79d))
* **04-03:** TiptapEditor + WikilinkAutocomplete + entity detail page ([c8d447c](https://github.com/alexwaddell97/worldbuilder/commit/c8d447cf85f9452ed40c795d6320aee2792921f3))
* **05:** Various improvements to entity editor ([c1dd925](https://github.com/alexwaddell97/worldbuilder/commit/c1dd925439e7923a40ca2648162f4ff3b4edca60))
* **06:** large updates to marketing site and in app editor ([246aaf5](https://github.com/alexwaddell97/worldbuilder/commit/246aaf5af9205ae5581e0cb2f3615720463d7f4e))
* **07:** major alpha patch for content ([46a8b4a](https://github.com/alexwaddell97/worldbuilder/commit/46a8b4ad29af0c3e96b48ad36054c357b7ec0da1))
* **08:** public sharable worlds ([025272f](https://github.com/alexwaddell97/worldbuilder/commit/025272fce0e2880f516d960977e71e73e1592c39))
* **10:** mobile UX for editor view ([50b6343](https://github.com/alexwaddell97/worldbuilder/commit/50b6343c960836096461870f69e03f7e92a87700))
* **11-2:** spotlight search and new icons pt2 ([0b9b3bd](https://github.com/alexwaddell97/worldbuilder/commit/0b9b3bd6a8db077b6b1821878da44579f6fe6537))
* **11:** spotlight search and new icons ([784ec0c](https://github.com/alexwaddell97/worldbuilder/commit/784ec0c7bdb130235976285e13676648bbc357e5))
* opengraph image generator ([1abbfa3](https://github.com/alexwaddell97/worldbuilder/commit/1abbfa3d8b148858a7cda975ba26cd01977c6089))
* release build features, update pages and tidying up marketing site. ([4da0f9c](https://github.com/alexwaddell97/worldbuilder/commit/4da0f9c296493806e0116e9185f054c23935621c))
* various ux updates ([5b4afd8](https://github.com/alexwaddell97/worldbuilder/commit/5b4afd8a962f513da80f31fb05fbd575b9832a6b))


### Bug Fixes

* **01:** CR-001 add [@theme](https://github.com/theme) inline block for Tailwind v4 color utilities ([4bee7ad](https://github.com/alexwaddell97/worldbuilder/commit/4bee7ad3fa65b47139d66ab5c58982e65f274a3f))
* **01:** CR-002 CR-003 validate email URL and surface Resend send errors ([30141e0](https://github.com/alexwaddell97/worldbuilder/commit/30141e0b626d0715a3d5e0807b6dbd04b46bac13))
* **01:** WR-001 add $onUpdate hook to worlds.updatedAt column ([1cf7ab9](https://github.com/alexwaddell97/worldbuilder/commit/1cf7ab944915ed21b05437b547598ebe5934aae3))
* **01:** WR-002 add error handling and loading state to handleResend ([b4138c9](https://github.com/alexwaddell97/worldbuilder/commit/b4138c98d6bcc67f7d0a43522c0c589f14824179))
* **01:** WR-003 add error handling to handleSignOut in sidebar ([9aad1d0](https://github.com/alexwaddell97/worldbuilder/commit/9aad1d038b241fd2fa0324e4b9e9814ed6b7e767))
* **01:** WR-004 migrate middleware.ts → proxy.ts, exclude all /api/ routes ([cfa6988](https://github.com/alexwaddell97/worldbuilder/commit/cfa6988a63317464762988d857373f6014d77756))
* **01:** WR-006 rename schema export to appSchema to avoid namespace collision ([0826794](https://github.com/alexwaddell97/worldbuilder/commit/08267941c4b2ee46204f9a695f66f89b1e914ad3))
* **02:** revise plans based on checker feedback ([0dc195e](https://github.com/alexwaddell97/worldbuilder/commit/0dc195e9183d7b5da709ee594d3f40e45bb51e59))
* add Better Auth tables to Drizzle schema and pass schema to adapter ([570ac45](https://github.com/alexwaddell97/worldbuilder/commit/570ac455718dd33ddcba46e0a6ed1bad3954a248))
* add resend verification email link on login; fix auth options ([04b24c5](https://github.com/alexwaddell97/worldbuilder/commit/04b24c55094b030d20566e1507c7f5fbc1ebdb5f))
* auth urls and loading ([ee55ca0](https://github.com/alexwaddell97/worldbuilder/commit/ee55ca0a502f9cddc604277bbec3f6ca7040e645))
* favicon and accessibility pass ([a597c86](https://github.com/alexwaddell97/worldbuilder/commit/a597c86faf3feda699aa956e0d6194897ee54f65))
* fonts for build ([575f572](https://github.com/alexwaddell97/worldbuilder/commit/575f572fe1fb7b6c73d48cbe3aa18127f7d1fe39))
* glass blur on marketing header ([7d23344](https://github.com/alexwaddell97/worldbuilder/commit/7d23344bae9d92e9204335dc7099058b1ea0fb3c))
* load .env.local in drizzle.config.ts via dotenv ([7e7d079](https://github.com/alexwaddell97/worldbuilder/commit/7e7d0797d66a938fa1d4f463ecf347061c3d5088))
* minor ux changes ([dbfd302](https://github.com/alexwaddell97/worldbuilder/commit/dbfd3024c2ca8275c8997ece503d415573710c5f))
* move sendVerificationEmail to root emailVerification option (Better Auth API) ([520f51f](https://github.com/alexwaddell97/worldbuilder/commit/520f51f6111326f5249ff1e4033a663adc1ef169))
* public/sharing logic changed for entities ([489b3e8](https://github.com/alexwaddell97/worldbuilder/commit/489b3e8df8dbd262edab6294d6508282c7a074c8))
* revert redirect route ([78d88f2](https://github.com/alexwaddell97/worldbuilder/commit/78d88f2fc525ad3430c7b37920014eb899070757))
* sidebar spacing issues ([4d252c7](https://github.com/alexwaddell97/worldbuilder/commit/4d252c70fe50116fa8474bad4a9c96ce75c90648))
* target master branch instead of main ([77b1a30](https://github.com/alexwaddell97/worldbuilder/commit/77b1a30c16d35a76842df40c9b5699229e78b35e))
* ts errors for build ([d236047](https://github.com/alexwaddell97/worldbuilder/commit/d236047fa49595128ce74d9df31ad5c7bcab7980))
* tsc build errors on marketing pages ([58c5488](https://github.com/alexwaddell97/worldbuilder/commit/58c5488c95c1227b624d510db741b5c6643d8c55))
* typing for Vercel build ([0048fba](https://github.com/alexwaddell97/worldbuilder/commit/0048fba2b5617d500ae60ef9a91bdf89a4643545))
* update tagline ([02aff36](https://github.com/alexwaddell97/worldbuilder/commit/02aff360a64ad4fc19d3bc66694eaefee8e4b3ce))
* various typing issues for build ([afb7a1c](https://github.com/alexwaddell97/worldbuilder/commit/afb7a1c2ff4b6e7924e62fe1a8f67091d0bc0ce7))
* width for logo on opengraph ([a9425c4](https://github.com/alexwaddell97/worldbuilder/commit/a9425c400e9fb15a373b4586c49a7411d1919abb))
* wire Resend email provider for Better Auth verification emails ([679d5cb](https://github.com/alexwaddell97/worldbuilder/commit/679d5cbe2667b4be6fe1bc5f83352b60947bb30f))
