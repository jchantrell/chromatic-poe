See [releases](https://github.com/jchantrell/chromatic-poe/releases) for all versions.
## [0.8.1](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.8.0...chromatic-poe-v0.8.1) (2026-01-06)


### Bug Fixes

* Don't draft release ([744ce38](https://github.com/jchantrell/chromatic-poe/commit/744ce38162f9fdb425bf52fb235e49e99c75150d))
* Explicitly create git tag in release workflow ([52ef88d](https://github.com/jchantrell/chromatic-poe/commit/52ef88ddd64e3669db9fd67cb998dcf88f4be487))


### Reverts

* "fix: Don't draft release" ([bcc4244](https://github.com/jchantrell/chromatic-poe/commit/bcc424464639476ce2f70462baaa8d7369e9f925))

## [0.8.0](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.7.2...chromatic-poe-v0.8.0) (2026-01-06)


### Features

* Support all newly added conditions ([5475349](https://github.com/jchantrell/chromatic-poe/commit/54753491f6fa98c8f45e3c59f639662511eaba08))
* Support importing mods and enchant conditions ([f1c090e](https://github.com/jchantrell/chromatic-poe/commit/f1c090e858c9b23c2ea921ee2aa0903d259157a6))

## [0.7.2](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.7.1...chromatic-poe-v0.7.2) (2026-01-06)


### Bug Fixes

* Add cloudflare account ID to wrangler config ([1a8bab4](https://github.com/jchantrell/chromatic-poe/commit/1a8bab473dfee4c7850a173364056e2efd86f53e))
* Add gh-pages and tauri env files ([28b5afe](https://github.com/jchantrell/chromatic-poe/commit/28b5afee367e86fffc1959e2f63cf4ce60466f6c))
* Add last-release-sha for manual starting point ([d2f945e](https://github.com/jchantrell/chromatic-poe/commit/d2f945e9ce0d6ee9fd34ddd97dda73e289c8d204))
* Add tauri localhost origin to proxy ([8572d78](https://github.com/jchantrell/chromatic-poe/commit/8572d78688195586b6ab1bb3d64ab580f8843bf2))
* GH release name ([ca4229b](https://github.com/jchantrell/chromatic-poe/commit/ca4229b494845cebe3c04d6be9bdc23b00b3a26b))
* Make tauri action and release-please play nice ([2a907fc](https://github.com/jchantrell/chromatic-poe/commit/2a907fc5b8eaa7aabd2acdb3e0392cca54cfe61c))
* Must specify GH repo when retrieving release ID ([f9d79d2](https://github.com/jchantrell/chromatic-poe/commit/f9d79d286ad0aafe597856d18b3117462f14d48a))
* Remove last-release-sha ([2848dfd](https://github.com/jchantrell/chromatic-poe/commit/2848dfd248fce6d77b77eee78a5e47d2cf86a3d2))


### Reverts

* Use correct wrangler syntax in GHA ([94d4501](https://github.com/jchantrell/chromatic-poe/commit/94d45015a8b9832f1f1380c7d43c2d5b9c113553))

## [0.7.1](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.7.0...chromatic-poe-v0.7.1) (2026-01-06)


### Bug Fixes

* add proxy urls in env files ([95488b9](https://github.com/jchantrell/chromatic-poe/commit/95488b911c315a04c4ae0d75183726676376742f))

## [0.7.0](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.6.0...chromatic-poe-v0.7.0) (2026-01-06)


### Features

* cloudflare worker cors proxy ([89f6f6b](https://github.com/jchantrell/chromatic-poe/commit/89f6f6bcfca60444e4524b8864dffd5eb78c895b))
* enchant mod support ([138cc17](https://github.com/jchantrell/chromatic-poe/commit/138cc17ce7fe04f5ad621b0eed05c2a4af5a526f))
* more granular app init progress bar ([8c9c0ce](https://github.com/jchantrell/chromatic-poe/commit/8c9c0cec2d64796700eee5efd47c8ecb7c7a9581))


### Bug Fixes

* application init race condition ([f57448d](https://github.com/jchantrell/chromatic-poe/commit/f57448db8d8e4297c5a85367fd23511468f2bbc3))
* make bool conditions serialise to correct syntax ([17da584](https://github.com/jchantrell/chromatic-poe/commit/17da5840881c67fb7b71b28047f6e0f83b6875c7))
* more init race conditions ([aa6c32d](https://github.com/jchantrell/chromatic-poe/commit/aa6c32d64b90a701298d554721faba8ba973d3ae))
* truncate progress toast msg ([0e8acf8](https://github.com/jchantrell/chromatic-poe/commit/0e8acf85645c2251e604b4b5b5c711da9508f148))

## [0.6.0](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.5.0...chromatic-poe-v0.6.0) (2025-12-23)


### Features

* undo/redo buttons in app bar ([a2aa415](https://github.com/jchantrell/chromatic-poe/commit/a2aa41559c8e7b6cdab3c96789fe0fb812dad69a))


### Bug Fixes

* avoid caching in filter preview ([a61ea8f](https://github.com/jchantrell/chromatic-poe/commit/a61ea8fe3d371dc78115b17152ecf5b86e0b5454))
* load filters together on page load ([e0197c9](https://github.com/jchantrell/chromatic-poe/commit/e0197c9f8116aad04f01feb584660d6f4338cb48))
* redo action shouldnt reapply raw condition ([6164053](https://github.com/jchantrell/chromatic-poe/commit/61640538dc026b09754ae7b4b7e1527d331c06bc))

## [0.5.0](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.4.9...chromatic-poe-v0.5.0) (2025-12-20)


### Features

* allow importable filters list to toggle between versions ([c886b16](https://github.com/jchantrell/chromatic-poe/commit/c886b1628c116abf5d4cdd96a671229b14fbb812))
* increase fuzzy search accuracy for rules ([7e98605](https://github.com/jchantrell/chromatic-poe/commit/7e9860599d1f8c6020762cefe8fe7d80aa34492d))
* more improvements to rule editor layout ([4b5b9c7](https://github.com/jchantrell/chromatic-poe/commit/4b5b9c7af5d58f61e7216e311da1bc516252d537))
* rule should only be sticky if it's expanded ([2211dd7](https://github.com/jchantrell/chromatic-poe/commit/2211dd7df271dfdf03d77fd847e145a8028c5415))
* virtualised scrolling for filter preview ([32f19a7](https://github.com/jchantrell/chromatic-poe/commit/32f19a7f54604209b9981def9f860d5de6682aa1))


### Bug Fixes

* add minor offset to rule list to prevent scrollbar ([44c963c](https://github.com/jchantrell/chromatic-poe/commit/44c963c6db826c20b6bad3fc96b2c38bba79f289))
* all browser warnings ([0695f45](https://github.com/jchantrell/chromatic-poe/commit/0695f45373df09ca737706b02c8273b4fba535eb))
* dont spellcheck rule names ([3f21810](https://github.com/jchantrell/chromatic-poe/commit/3f218105291678e1a49ef4129f691cbb310d20d1))
* imported sounds on desktop ([0093c1c](https://github.com/jchantrell/chromatic-poe/commit/0093c1c5e9efc97d820233e767ca7400d9b65355))
* layout issues for extremely long rule names ([c8b423b](https://github.com/jchantrell/chromatic-poe/commit/c8b423bcabd12a512af998009842bcd81f640fee))
* rule menu entry flex behaviour ([c4679ce](https://github.com/jchantrell/chromatic-poe/commit/c4679ce619b5d0fe185b3780103e23e7a2d29ec1))
* rule menu entry preview should be clickable ([ae092a4](https://github.com/jchantrell/chromatic-poe/commit/ae092a46f226b684a24448ffb0af5877b3cb65ba))
* use correct separator for OS when writing filter ([361caf9](https://github.com/jchantrell/chromatic-poe/commit/361caf97a93ad266631d09a7ffa2b87148fc6481))
* windows poe dir path ([39b01ac](https://github.com/jchantrell/chromatic-poe/commit/39b01ac7d9a256a871f287529e5c707b735a648b))


### Performance Improvements

* only update rule map icon when it changes ([e19550a](https://github.com/jchantrell/chromatic-poe/commit/e19550a9ee9019848ab9fdd7a7800522c4f4db85))

## [0.4.9](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.4.8...chromatic-poe-v0.4.9) (2025-12-19)


### Bug Fixes

* ensure all cfg files update on release ([b103266](https://github.com/jchantrell/chromatic-poe/commit/b103266d1c5d150f91433044453df103d7450f11))

## [0.4.8](https://github.com/jchantrell/chromatic-poe/compare/chromatic-poe-v0.4.7...chromatic-poe-v0.4.8) (2025-12-19)


### Features

* **core:** configure auto updates ([c361d68](https://github.com/jchantrell/chromatic-poe/commit/c361d68a042bd5e2662d3e2229340727c3b6027d))
* **core:** filter beams ([c676954](https://github.com/jchantrell/chromatic-poe/commit/c6769549871d5f7f5d6636941aa230dde84a72f9))
* **core:** item hierarchy picker implementation ([c085124](https://github.com/jchantrell/chromatic-poe/commit/c085124be197461b9345dceed686d92e84e54489))
* **core:** search index poc ([7bc6096](https://github.com/jchantrell/chromatic-poe/commit/7bc60961b67c90ca73064fe8239cb3f483c01d1b))
* **dat:** add poe2 unique items ([4e29af7](https://github.com/jchantrell/chromatic-poe/commit/4e29af7c0dc4a9f70243fdf4030719d93d1ba803))
* **dat:** add special casing for the road warrior ([b26c16c](https://github.com/jchantrell/chromatic-poe/commit/b26c16cbeb99a571b0ae3b51d870a1686261c522))
* **dat:** gem types ([32b2d87](https://github.com/jchantrell/chromatic-poe/commit/32b2d8776a555a7a5a995827788776953cc6fcc1))
* **dat:** unique bases, omens and improvements to hierarchy picker ([a0636f3](https://github.com/jchantrell/chromatic-poe/commit/a0636f377ddd053caae41451529b5cc1ff696286))
* **editor:** add 1000ms timeout to auto reload ([718c5a1](https://github.com/jchantrell/chromatic-poe/commit/718c5a1ae9e7d3c357af9ba5c9cc5c5466c93197))
* **editor:** add full text search for rules + item picker ([60f5f28](https://github.com/jchantrell/chromatic-poe/commit/60f5f286ad9494658a23c6fe2e137daf735e3d0f))
* **editor:** add minimal starter template ([23fb6f0](https://github.com/jchantrell/chromatic-poe/commit/23fb6f04043be9e29a1a1bd7683b50e3bbe9ca24))
* **editor:** auto reloading in game filter ([9cabf61](https://github.com/jchantrell/chromatic-poe/commit/9cabf61ddab95193c8b329009ba43a7c86db8000))
* **editor:** basic local storage implementation for web version ([e9d4ac4](https://github.com/jchantrell/chromatic-poe/commit/e9d4ac455c5178826639f401096b2a9e9c4ceee8))
* **editor:** check for updates on app launch + improve notifications ([7cb58a4](https://github.com/jchantrell/chromatic-poe/commit/7cb58a4e9560e84307ba1cb4dccd3250a45a39c6))
* **editor:** clean up styles of rule + condition sections ([ae24565](https://github.com/jchantrell/chromatic-poe/commit/ae245652ab583570c7e7b0c26067bd1d066a7775))
* **editor:** condition builder poc ([2f01cab](https://github.com/jchantrell/chromatic-poe/commit/2f01cab3bf9f03751abb782e752ffc5b68479862))
* **editor:** context menu entry to access base picker ([791d426](https://github.com/jchantrell/chromatic-poe/commit/791d426d8aa75411afca4c93cf96a411c3035423))
* **editor:** desktop importable filters ([289fb1f](https://github.com/jchantrell/chromatic-poe/commit/289fb1f9d365b8ed74727c72fb26fcd170702e23))
* **editor:** duplicate rules via context menu ([782e17d](https://github.com/jchantrell/chromatic-poe/commit/782e17d72e34857cbe27ceb74ac59ed64b5ad43b))
* **editor:** enable auto save at 15sec interval ([e9bee92](https://github.com/jchantrell/chromatic-poe/commit/e9bee92a04e7dc42c4a84e3c643b38917ed2e6bc))
* **editor:** functional condition builder and serialisation ([6a9e3df](https://github.com/jchantrell/chromatic-poe/commit/6a9e3df587aeef2ddae5cc0c51c3ef6a57d33b3e))
* **editor:** functional condition builder with toggles ([de0b6d6](https://github.com/jchantrell/chromatic-poe/commit/de0b6d64a4e1c6c87a50c47284c1af249cd31910))
* **editor:** icons for ancestors in hierarchy picker ([7e468a7](https://github.com/jchantrell/chromatic-poe/commit/7e468a79a35e593517d1d2036b79e0439da17a85))
* **editor:** improve filter import logic using fuzzy finding ([093f749](https://github.com/jchantrell/chromatic-poe/commit/093f74952cf3d1241872cc2cf926dcb4e8906577))
* **editor:** large amount of clean up for condition builder feature ([119bff0](https://github.com/jchantrell/chromatic-poe/commit/119bff01dd39d77cb04c052b1091ac15eac5b41b))
* **editor:** make add conditions ui searchable ([67ecdaa](https://github.com/jchantrell/chromatic-poe/commit/67ecdaa8673b3ca128ed3cc6921c5010942bb5c3))
* **editor:** minor toast notification improvements ([b9c505e](https://github.com/jchantrell/chromatic-poe/commit/b9c505e02fcb22c49717ade25453deb5716bb0a4))
* **editor:** notify if no updates available ([2a716a3](https://github.com/jchantrell/chromatic-poe/commit/2a716a396c46b7c6e07cb768d53a8889af936b7d))
* **editor:** pin rule container search box and create rule buttons ([e1bf1c7](https://github.com/jchantrell/chromatic-poe/commit/e1bf1c735b2e11805a67e160b491fc3294568965))
* **editor:** readd save filter notification and less spammy location ([e42a0f9](https://github.com/jchantrell/chromatic-poe/commit/e42a0f944d98507d434519b48c7f47d36b698100))
* **editor:** replace labels with text field inputs in condition sliders ([990acf6](https://github.com/jchantrell/chromatic-poe/commit/990acf6560bb40df051be3ab2692c3e63903f2a4))
* **editor:** rework routing & some minor qol improvements ([50ebac3](https://github.com/jchantrell/chromatic-poe/commit/50ebac31d5d89d71082a024662ac5f340898d7bc))
* **editor:** save to downloads for web version ([ba6052a](https://github.com/jchantrell/chromatic-poe/commit/ba6052a38fb637e0bba366a183fbc92a7006c270))
* **editor:** sortable rules ([8a67129](https://github.com/jchantrell/chromatic-poe/commit/8a6712997ec9d4941bfd6b9db80fb4c285c4ec1a))
* **editor:** sound management ui ([b7fe3a1](https://github.com/jchantrell/chromatic-poe/commit/b7fe3a1f5e2d44fbf72a71ff4ace969df3ea9dcd))
* **editor:** sound picker ([25c875d](https://github.com/jchantrell/chromatic-poe/commit/25c875dbac018f6fe8cc8e770425dd0eae092871))
* **editor:** swap to solid router for better path handling ([b791728](https://github.com/jchantrell/chromatic-poe/commit/b79172893dfe80e1c8dae1ad7e8efaa88e89f91e))
* **editor:** toast notifications for app update progress ([1cc1a03](https://github.com/jchantrell/chromatic-poe/commit/1cc1a03500c8cabe4ef6ce9783975796a4f06be0))
* **editor:** unique item support ([9cccd34](https://github.com/jchantrell/chromatic-poe/commit/9cccd3412cbbf58f45716c47cd0974c164a81e01))
* improve poe1 item hierarchy ([aa9fd6f](https://github.com/jchantrell/chromatic-poe/commit/aa9fd6f6b799a45d210616b8b43de27b080df82a))
* improve the init load sequence ([6aa194a](https://github.com/jchantrell/chromatic-poe/commit/6aa194a17e24a0b2af03553cdeeec25cac1a76ff))
* initial item mod condition implementation ([f443a31](https://github.com/jchantrell/chromatic-poe/commit/f443a31d84b4f693249205d0b732609e2e5d659f))
* load icon spritesheet into global store ([d10caf6](https://github.com/jchantrell/chromatic-poe/commit/d10caf6fc544bd0c19ee04e4f44e9648e4c26335))
* migrate mod support ([a38847b](https://github.com/jchantrell/chromatic-poe/commit/a38847b5a15e7f1624bcf3aa821212bb659cc18e))
* more improvements to init load sequence ([2f451dc](https://github.com/jchantrell/chromatic-poe/commit/2f451dc16e51ebc8313b0e7b86b27bf45357ceb3))
* scroll to index of unexpanded rule ([0f8c8b9](https://github.com/jchantrell/chromatic-poe/commit/0f8c8b98655d280af4f8f27f622803c578b5a7bd))
* shared drop preview component ([8dffbd5](https://github.com/jchantrell/chromatic-poe/commit/8dffbd543e13d9ac84886e8112babc4fb17758cd))
* sticky positioning for expanded rules ([3a213e3](https://github.com/jchantrell/chromatic-poe/commit/3a213e3d23a0264ff2d7fb5192af3371f7853d56))
* update poe1 query ([8050b97](https://github.com/jchantrell/chromatic-poe/commit/8050b97e49e669316f29ec129038dd5f2debd4ba))
* upgrade tailwind to v4 ([47a1bbf](https://github.com/jchantrell/chromatic-poe/commit/47a1bbf7fd40978ec3f2c98bac5db5aea8fba332))
* url path loading for filters ([54cb28e](https://github.com/jchantrell/chromatic-poe/commit/54cb28e7d0e593d55f5ca2a00d44222782645764))
* virtualised scrolling for rules ([f1bf17c](https://github.com/jchantrell/chromatic-poe/commit/f1bf17c123d673976221ac48f9527507b6438b7a))
* wip item mod support ([fa49738](https://github.com/jchantrell/chromatic-poe/commit/fa497381db52038badde1ab503dba4a64175c2ac))
* wip wiki support ([7c23543](https://github.com/jchantrell/chromatic-poe/commit/7c235434a2bc80ad18bb0422ed82b0308d529986))


### Bug Fixes

* allow filter to be saved to idb ([ed31e0d](https://github.com/jchantrell/chromatic-poe/commit/ed31e0d7d391bd94773489b96ecd7a847e2728e2))
* **backend:** clean up build warnings ([650f846](https://github.com/jchantrell/chromatic-poe/commit/650f8460ea7a7c7ed6adcd8fba7b66bc883ec83c))
* **ci:** github action angry about pnpm version ([fb2c0e1](https://github.com/jchantrell/chromatic-poe/commit/fb2c0e149ce9f14feebfd0f0162a475027445806))
* **ci:** install pnpm before node setup ([6070d6e](https://github.com/jchantrell/chromatic-poe/commit/6070d6e27b14642a1106e796cd10a6fda0565914))
* **ci:** invalid workflow syntax ([27b1338](https://github.com/jchantrell/chromatic-poe/commit/27b1338d6dbde1e9299881595a06a86f8e45187b))
* **ci:** simplify steps and fix syntax ([dcbe05f](https://github.com/jchantrell/chromatic-poe/commit/dcbe05fccb4bd07cfbaccaf1a689ff3d1bc07f64))
* **ci:** specify pnpm version ([49f2422](https://github.com/jchantrell/chromatic-poe/commit/49f2422528c935d310303273ba08b08d95abacfa))
* comment out linux build for now ([2a357cb](https://github.com/jchantrell/chromatic-poe/commit/2a357cb2dfdcf74d51b37ffaf42487328eb644dd))
* **dat:** change ordering of armour hierarchy ([4af6ebd](https://github.com/jchantrell/chromatic-poe/commit/4af6ebdaaacd19e734b196c504d277f048b3241c))
* **dat:** missing condition for eva/es bases ([77b4d44](https://github.com/jchantrell/chromatic-poe/commit/77b4d44d997b77db0b9a274886733921cfd9a204))
* **dat:** remove unnecessary alpha multiply on filter write ([0287643](https://github.com/jchantrell/chromatic-poe/commit/0287643443a75f09dad961ce272446a62f30473f))
* **dat:** special case wailing wall unique basetype ([b77a0b0](https://github.com/jchantrell/chromatic-poe/commit/b77a0b00e8f9010e6a0176ef9d2d9887c294f4d0))
* **dat:** uncomment file fetching ([91c19f4](https://github.com/jchantrell/chromatic-poe/commit/91c19f4ccd9776312285e7fa29f85db6b4b692ad))
* **editor:** add button for item picker in rule editor ([228103c](https://github.com/jchantrell/chromatic-poe/commit/228103c6fc38156f1abb9ad171d340745db60c67))
* **editor:** add default name to importable rules so they arent filtered ([784b77a](https://github.com/jchantrell/chromatic-poe/commit/784b77aeec1188ec3f3aa690a6c8e9928e650de7))
* **editor:** add max value of 5000 to all armour types ([8aea4a1](https://github.com/jchantrell/chromatic-poe/commit/8aea4a197dfe5c990ada9f9a9a87bccded46f06b))
* **editor:** another attempt at fixing img path issues in gh-pages ([1b00517](https://github.com/jchantrell/chromatic-poe/commit/1b005175785a6c5c91718cb1bcf6e5c65ab318e0))
* **editor:** attempt to fix missing map icon img ([1c963e9](https://github.com/jchantrell/chromatic-poe/commit/1c963e91250111b9b73e85f31a9802679c39bd7e))
* **editor:** beam color in drifted state ([4279762](https://github.com/jchantrell/chromatic-poe/commit/4279762d09fe45460b2cbfb0c4ccab0dfdc158c5))
* **editor:** better overflow handling in item picker ([c4308d1](https://github.com/jchantrell/chromatic-poe/commit/c4308d1573cc40b95d261f3c263d2dea88c692ac))
* **editor:** centre item picker + prevent child from causing overflow ([f988f51](https://github.com/jchantrell/chromatic-poe/commit/f988f511e15d665ad304effeba9c8f52d6284c36))
* **editor:** clean up state when disabling special cased branches ([d34b06c](https://github.com/jchantrell/chromatic-poe/commit/d34b06c9c060e28e7c309e216c35f2c40e69f9e8))
* **editor:** close button in dialog windows ([34b199f](https://github.com/jchantrell/chromatic-poe/commit/34b199f7737ac1e2c8ae522d00a89ea81221848c))
* **editor:** condition editor should represent current state ([6792ee6](https://github.com/jchantrell/chromatic-poe/commit/6792ee6febd0cdc788d068e2795cc107c24e0517))
* **editor:** copy + rename filter ([160bc6a](https://github.com/jchantrell/chromatic-poe/commit/160bc6a125c716d0733f6d12c5d78936fa511306))
* **editor:** correct casing for minimap png import ([9df135c](https://github.com/jchantrell/chromatic-poe/commit/9df135c57ccb3bef833cbbf4438ec8adb23d2291))
* **editor:** differentiate default & custom sounds properly ([5232bf1](https://github.com/jchantrell/chromatic-poe/commit/5232bf1aed2a768ed5345eea4e4f2f9812d5a4a8))
* **editor:** disabling a child shouldnt disable all siblings ([14d417b](https://github.com/jchantrell/chromatic-poe/commit/14d417b39652274c9012637de7873e023c22e3f6))
* **editor:** dont close item picker after selecting items ([586e7d0](https://github.com/jchantrell/chromatic-poe/commit/586e7d08216a8c2945eaf3e14cc5612964793620))
* **editor:** dont serialise empty list of item mods ([8682be5](https://github.com/jchantrell/chromatic-poe/commit/8682be5ae4ddf65ae46419f888feaf7d43fe0d12))
* **editor:** dumb shared ref regression ([7cb6d5a](https://github.com/jchantrell/chromatic-poe/commit/7cb6d5a79bc8e873bb41b035c7fc9d6e682941c9))
* **editor:** empty list of items shouldnt return true ([cd6def1](https://github.com/jchantrell/chromatic-poe/commit/cd6def1f2e7f81237bf9776edb4445b388c309bf))
* **editor:** enchanted bool condition ([5c6e739](https://github.com/jchantrell/chromatic-poe/commit/5c6e73961687f914767fe3532e79132195068701))
* **editor:** enforce dark mode for now ([9aba540](https://github.com/jchantrell/chromatic-poe/commit/9aba5401b1279d323f825c90172ae0c623f78330))
* **editor:** existing items not enabled in item picker ([00df2e2](https://github.com/jchantrell/chromatic-poe/commit/00df2e2dc86333a7a874df307e10604f3beb675a))
* **editor:** fetch cached and default sounds on page changes ([82f4ba3](https://github.com/jchantrell/chromatic-poe/commit/82f4ba32c5182748b3454c4c4292de2d53dbfb06))
* **editor:** handle corrupt cached sounds ([f99d7d4](https://github.com/jchantrell/chromatic-poe/commit/f99d7d4bc564e5dff32b542b5ea41ad1de41013a))
* **editor:** handle edge cases in legacy filter format ([98b135a](https://github.com/jchantrell/chromatic-poe/commit/98b135a0a7c4f9351e17e689a9a4f14f090f8ae8))
* **editor:** handle paths with base url ([7e2428e](https://github.com/jchantrell/chromatic-poe/commit/7e2428ef1e229d41364a6f79eb6161b683ad5455))
* **editor:** ignore a few unsupported conditions in import for now ([0ffe171](https://github.com/jchantrell/chromatic-poe/commit/0ffe17144d8069233bb8944b64b1a3c63b83a17e))
* **editor:** initial inaccurate state for item picker ([d4d6197](https://github.com/jchantrell/chromatic-poe/commit/d4d6197b39a7cfb3a7478c4550ed98394af4467c))
* **editor:** item picker name collision ([065d15c](https://github.com/jchantrell/chromatic-poe/commit/065d15c765379b83b188de02987f90c770e85061))
* **editor:** make item picker scrollable ([bfd6337](https://github.com/jchantrell/chromatic-poe/commit/bfd6337fc75d571ff4dc7fd9db744ccee73e5358))
* **editor:** make notification less noisy ([1265df7](https://github.com/jchantrell/chromatic-poe/commit/1265df702702dffc1f16f332a24ce08694869125))
* **editor:** make the whole side bar button clickable ([0ef96f4](https://github.com/jchantrell/chromatic-poe/commit/0ef96f40b73a64e81e2401f1ff9185d147cdc06f))
* **editor:** map icon not displaying because of gh-pages path ([8dd5643](https://github.com/jchantrell/chromatic-poe/commit/8dd5643c47ae30e5038ab5fe12e69f5779841d13))
* **editor:** mutual exclusivity for special cased branches ([973274b](https://github.com/jchantrell/chromatic-poe/commit/973274b0f20fab9d6a2e0bdf5b9ee73c9818ae05))
* **editor:** nested routing was a bad idea ([9e1157a](https://github.com/jchantrell/chromatic-poe/commit/9e1157acd4b1b3bdb74ddaa8ad43861a28d1b3e0))
* **editor:** pass the correct params to BaseType condition ([74aa253](https://github.com/jchantrell/chromatic-poe/commit/74aa2530e204b6b825d602017a699a3f419a0058))
* **editor:** re-enable auto reloading ([26c9425](https://github.com/jchantrell/chromatic-poe/commit/26c94258d6a07d6291a54c45ea1baaf941b5816f))
* **editor:** remove runtime version override ([ed67554](https://github.com/jchantrell/chromatic-poe/commit/ed675543e8536a82ab6729aca84f60e7722451ab))
* **editor:** remove the json preserve hack + other dead code ([0850563](https://github.com/jchantrell/chromatic-poe/commit/08505632bf8c65441c7918f08aed1d98c67ccb5b))
* **editor:** removing undefined condition removes condition object ([3a32418](https://github.com/jchantrell/chromatic-poe/commit/3a324181f2087022f3c826cd0c644ececb5d712d))
* **editor:** save and delete file semantics ([272aa0a](https://github.com/jchantrell/chromatic-poe/commit/272aa0a0cd57512d90e77ec19526637accb6749b))
* **editor:** scrollable rules ([93a3956](https://github.com/jchantrell/chromatic-poe/commit/93a3956f7f6c568680a9c3ff8c6baf4a2d737a6b))
* **editor:** search filter shouldnt exclude newly created rules ([c276429](https://github.com/jchantrell/chromatic-poe/commit/c276429d91e6762273783ff1f4695df99d3c3eae))
* **editor:** signal state drift on enabled conditions ([8302dc6](https://github.com/jchantrell/chromatic-poe/commit/8302dc63f8aeb3d96f6668eb2be66e73143e40f2))
* **editor:** socket count ([51cd729](https://github.com/jchantrell/chromatic-poe/commit/51cd7290bf15bd2265290d222ef5f0c9f31e3359))
* **editor:** use base url in route ([8046110](https://github.com/jchantrell/chromatic-poe/commit/80461102088f1ed9db377c5ddb982eff7c890b71))
* **editor:** use grid over hacky flex solution for app container ([b3cf165](https://github.com/jchantrell/chromatic-poe/commit/b3cf16584e6c5f734dbbfd97e6d2d929555dc924))
* **editor:** waystonetier over maptier ([832f8d2](https://github.com/jchantrell/chromatic-poe/commit/832f8d2cbbb51cf97d780df7e71b3e343a4ce5ae))
* explicitly create dirs prior to extract ([40fdc6b](https://github.com/jchantrell/chromatic-poe/commit/40fdc6b3418f0129524bd2b1c1bf566c754a1479))
* import over require for tailwind config ([bbe706f](https://github.com/jchantrell/chromatic-poe/commit/bbe706f40618c0844e824a1b6337f89e370dbcf2))
* make rules sorting + virtualisation more compatible ([dc8cfbc](https://github.com/jchantrell/chromatic-poe/commit/dc8cfbc75eb25899dca5c051b6ad0fd4053fd48e))
* minimap icons ([35c1cdf](https://github.com/jchantrell/chromatic-poe/commit/35c1cdffe1b472bf46b94555cab03df459cf05e2))
* only expanded rules should be sticky ([634d34e](https://github.com/jchantrell/chromatic-poe/commit/634d34eef23c2428e973626196c8cc56da91a28c))
* prevent hanging dialog after filter deletion ([d6eb696](https://github.com/jchantrell/chromatic-poe/commit/d6eb6962b6636bb5219fc8310daaba9121e729e6))
* readd search to item picker ([dd8c03b](https://github.com/jchantrell/chromatic-poe/commit/dd8c03bc04c1ea0b818f82546ad59e4fe55bbd70))
* remove generated minimap json from src control ([cd115da](https://github.com/jchantrell/chromatic-poe/commit/cd115da65ead497e6851c0e743a80736f8790fee))
* type errors/warnings ([6ef3e99](https://github.com/jchantrell/chromatic-poe/commit/6ef3e99bfa4c868b8e2597b000f5f438c73fc027))
* use local gif file over external link ([132b3eb](https://github.com/jchantrell/chromatic-poe/commit/132b3eb2a5a49402771ca129362418ce69b99896))
* use relative image dir ([d68c8fd](https://github.com/jchantrell/chromatic-poe/commit/d68c8fd4c24922b5d89cb2690bd201dd0a12d8f7))


### Performance Improvements

* **editor:** add memoizations and prevent redundant updates ([e9af0b9](https://github.com/jchantrell/chromatic-poe/commit/e9af0b996b1600bce8e6d35b563ca398c691ff92))


### Reverts

* "fix(dat): special case wailing wall unique basetype" ([d21fed6](https://github.com/jchantrell/chromatic-poe/commit/d21fed6c530a0d2a7dc98a103e7f0d7ce5b3611f))
* "revert: "fix(dat): special case wailing wall unique basetype"" ([7c743a8](https://github.com/jchantrell/chromatic-poe/commit/7c743a8180fbec87d1596aa50819340c8ff52c53))


### Miscellaneous Chores

* release 0.4.8 ([38c99ef](https://github.com/jchantrell/chromatic-poe/commit/38c99efddbc826b7950953b4f3505548c4d8a906))

## [0.4.7](https://github.com/jchantrell/chromatic-poe/compare/v0.4.6..v0.4.7) (2025-01-27)

### Bug Fixes

* **editor:** Better overflow handling in item picker ([c4308d1](https://github.com/jchantrell/chromatic-poe/commit/c4308d1573cc40b95d261f3c263d2dea88c692ac))

### Documentation

* Add vitaminmoo to acknowledgements ([51c4534](https://github.com/jchantrell/chromatic-poe/commit/51c4534d2fc4c08e47ee630eaddae44764c92027))

### Miscellaneous Chores

* **release:** V0.4.7 ([4afebc6](https://github.com/jchantrell/chromatic-poe/commit/4afebc6c40df4ec929eb01235b17925c5e1cfd52))
## [0.4.6](https://github.com/jchantrell/chromatic-poe/compare/v0.4.5..v0.4.6) (2025-01-20)

### Miscellaneous Chores

* **release:** V0.4.6 ([5c62efd](https://github.com/jchantrell/chromatic-poe/commit/5c62efdbf2e24e92425624b1cd3fc991621fb42a))
* Sync release version tags ([4e19314](https://github.com/jchantrell/chromatic-poe/commit/4e1931459e3c986b7ebb115b2177340b1411d81d))
## [0.4.5](https://github.com/jchantrell/chromatic-poe/compare/v0.4.4..v0.4.5) (2025-01-20)

### Features

* **core:** Configure auto updates ([c361d68](https://github.com/jchantrell/chromatic-poe/commit/c361d68a042bd5e2662d3e2229340727c3b6027d))
* **core:** Search index poc ([7bc6096](https://github.com/jchantrell/chromatic-poe/commit/7bc60961b67c90ca73064fe8239cb3f483c01d1b))
* **core:** Filter beams ([c676954](https://github.com/jchantrell/chromatic-poe/commit/c6769549871d5f7f5d6636941aa230dde84a72f9))
* **dat:** Add special casing for the road warrior ([b26c16c](https://github.com/jchantrell/chromatic-poe/commit/b26c16cbeb99a571b0ae3b51d870a1686261c522))
* **dat:** Unique bases, omens and improvements to hierarchy picker ([a0636f3](https://github.com/jchantrell/chromatic-poe/commit/a0636f377ddd053caae41451529b5cc1ff696286))
* **dat:** Add poe2 unique items ([4e29af7](https://github.com/jchantrell/chromatic-poe/commit/4e29af7c0dc4a9f70243fdf4030719d93d1ba803))
* **dat:** Gem types ([32b2d87](https://github.com/jchantrell/chromatic-poe/commit/32b2d8776a555a7a5a995827788776953cc6fcc1))
* **editor:** Make add conditions ui searchable ([67ecdaa](https://github.com/jchantrell/chromatic-poe/commit/67ecdaa8673b3ca128ed3cc6921c5010942bb5c3))
* **editor:** Minor toast notification improvements ([b9c505e](https://github.com/jchantrell/chromatic-poe/commit/b9c505e02fcb22c49717ade25453deb5716bb0a4))
* **editor:** Readd save filter notification and less spammy location ([e42a0f9](https://github.com/jchantrell/chromatic-poe/commit/e42a0f944d98507d434519b48c7f47d36b698100))
* **editor:** Add minimal starter template ([23fb6f0](https://github.com/jchantrell/chromatic-poe/commit/23fb6f04043be9e29a1a1bd7683b50e3bbe9ca24))
* **editor:** Enable auto save at 15sec interval ([e9bee92](https://github.com/jchantrell/chromatic-poe/commit/e9bee92a04e7dc42c4a84e3c643b38917ed2e6bc))
* **editor:** Check for updates on app launch + improve notifications ([7cb58a4](https://github.com/jchantrell/chromatic-poe/commit/7cb58a4e9560e84307ba1cb4dccd3250a45a39c6))
* **editor:** Toast notifications for app update progress ([1cc1a03](https://github.com/jchantrell/chromatic-poe/commit/1cc1a03500c8cabe4ef6ce9783975796a4f06be0))
* **editor:** Notify if no updates available ([2a716a3](https://github.com/jchantrell/chromatic-poe/commit/2a716a396c46b7c6e07cb768d53a8889af936b7d))
* **editor:** Add full text search for rules + item picker ([60f5f28](https://github.com/jchantrell/chromatic-poe/commit/60f5f286ad9494658a23c6fe2e137daf735e3d0f))
* **editor:** Replace labels with text field inputs in condition sliders ([990acf6](https://github.com/jchantrell/chromatic-poe/commit/990acf6560bb40df051be3ab2692c3e63903f2a4))
* **editor:** Add 1000ms timeout to auto reload ([718c5a1](https://github.com/jchantrell/chromatic-poe/commit/718c5a1ae9e7d3c357af9ba5c9cc5c5466c93197))
* **editor:** Clean up styles of rule + condition sections ([ae24565](https://github.com/jchantrell/chromatic-poe/commit/ae245652ab583570c7e7b0c26067bd1d066a7775))
* **editor:** Sound picker ([25c875d](https://github.com/jchantrell/chromatic-poe/commit/25c875dbac018f6fe8cc8e770425dd0eae092871))
* **editor:** Duplicate rules via context menu ([782e17d](https://github.com/jchantrell/chromatic-poe/commit/782e17d72e34857cbe27ceb74ac59ed64b5ad43b))
* **editor:** Unique item support ([9cccd34](https://github.com/jchantrell/chromatic-poe/commit/9cccd3412cbbf58f45716c47cd0974c164a81e01))
* **editor:** Functional condition builder with toggles ([de0b6d6](https://github.com/jchantrell/chromatic-poe/commit/de0b6d64a4e1c6c87a50c47284c1af249cd31910))
* **editor:** Functional condition builder and serialisation ([6a9e3df](https://github.com/jchantrell/chromatic-poe/commit/6a9e3df587aeef2ddae5cc0c51c3ef6a57d33b3e))
* **editor:** Save to downloads for web version ([ba6052a](https://github.com/jchantrell/chromatic-poe/commit/ba6052a38fb637e0bba366a183fbc92a7006c270))
* **editor:** Swap to solid router for better path handling ([b791728](https://github.com/jchantrell/chromatic-poe/commit/b79172893dfe80e1c8dae1ad7e8efaa88e89f91e))
* **editor:** Basic local storage implementation for web version ([e9d4ac4](https://github.com/jchantrell/chromatic-poe/commit/e9d4ac455c5178826639f401096b2a9e9c4ceee8))
* **editor:** Icons for ancestors in hierarchy picker ([7e468a7](https://github.com/jchantrell/chromatic-poe/commit/7e468a79a35e593517d1d2036b79e0439da17a85))
* **editor:** Condition builder poc ([2f01cab](https://github.com/jchantrell/chromatic-poe/commit/2f01cab3bf9f03751abb782e752ffc5b68479862))
* **editor:** Sortable rules ([8a67129](https://github.com/jchantrell/chromatic-poe/commit/8a6712997ec9d4941bfd6b9db80fb4c285c4ec1a))
* **editor:** Context menu entry to access base picker ([791d426](https://github.com/jchantrell/chromatic-poe/commit/791d426d8aa75411afca4c93cf96a411c3035423))

### Bug Fixes

* **backend:** Clean up build warnings ([650f846](https://github.com/jchantrell/chromatic-poe/commit/650f8460ea7a7c7ed6adcd8fba7b66bc883ec83c))
* **ci:** Github action angry about pnpm version ([fb2c0e1](https://github.com/jchantrell/chromatic-poe/commit/fb2c0e149ce9f14feebfd0f0162a475027445806))
* **ci:** Simplify steps and fix syntax ([dcbe05f](https://github.com/jchantrell/chromatic-poe/commit/dcbe05fccb4bd07cfbaccaf1a689ff3d1bc07f64))
* **ci:** Invalid workflow syntax ([27b1338](https://github.com/jchantrell/chromatic-poe/commit/27b1338d6dbde1e9299881595a06a86f8e45187b))
* **ci:** Specify pnpm version ([49f2422](https://github.com/jchantrell/chromatic-poe/commit/49f2422528c935d310303273ba08b08d95abacfa))
* **ci:** Install pnpm before node setup ([6070d6e](https://github.com/jchantrell/chromatic-poe/commit/6070d6e27b14642a1106e796cd10a6fda0565914))
* **dat:** Missing condition for eva/es bases ([77b4d44](https://github.com/jchantrell/chromatic-poe/commit/77b4d44d997b77db0b9a274886733921cfd9a204))
* **dat:** Uncomment file fetching ([91c19f4](https://github.com/jchantrell/chromatic-poe/commit/91c19f4ccd9776312285e7fa29f85db6b4b692ad))
* **dat:** Special case wailing wall unique basetype ([b77a0b0](https://github.com/jchantrell/chromatic-poe/commit/b77a0b00e8f9010e6a0176ef9d2d9887c294f4d0))
* **dat:** Change ordering of armour hierarchy ([4af6ebd](https://github.com/jchantrell/chromatic-poe/commit/4af6ebdaaacd19e734b196c504d277f048b3241c))
* **dat:** Remove unnecessary alpha multiply on filter write ([0287643](https://github.com/jchantrell/chromatic-poe/commit/0287643443a75f09dad961ce272446a62f30473f))
* **editor:** Pass the correct params to BaseType condition ([74aa253](https://github.com/jchantrell/chromatic-poe/commit/74aa2530e204b6b825d602017a699a3f419a0058))
* **editor:** Make item picker scrollable ([bfd6337](https://github.com/jchantrell/chromatic-poe/commit/bfd6337fc75d571ff4dc7fd9db744ccee73e5358))
* **editor:** Centre item picker + prevent child from causing overflow ([f988f51](https://github.com/jchantrell/chromatic-poe/commit/f988f511e15d665ad304effeba9c8f52d6284c36))
* **editor:** Dont close item picker after selecting items ([586e7d0](https://github.com/jchantrell/chromatic-poe/commit/586e7d08216a8c2945eaf3e14cc5612964793620))
* **editor:** Search filter shouldnt exclude newly created rules ([c276429](https://github.com/jchantrell/chromatic-poe/commit/c276429d91e6762273783ff1f4695df99d3c3eae))
* **editor:** Add default name to importable rules so they arent filtered ([784b77a](https://github.com/jchantrell/chromatic-poe/commit/784b77aeec1188ec3f3aa690a6c8e9928e650de7))
* **editor:** Handle corrupt cached sounds ([f99d7d4](https://github.com/jchantrell/chromatic-poe/commit/f99d7d4bc564e5dff32b542b5ea41ad1de41013a))
* **editor:** Ignore a few unsupported conditions in import for now ([0ffe171](https://github.com/jchantrell/chromatic-poe/commit/0ffe17144d8069233bb8944b64b1a3c63b83a17e))
* **editor:** Handle edge cases in legacy filter format ([98b135a](https://github.com/jchantrell/chromatic-poe/commit/98b135a0a7c4f9351e17e689a9a4f14f090f8ae8))
* **editor:** Fetch cached and default sounds on page changes ([82f4ba3](https://github.com/jchantrell/chromatic-poe/commit/82f4ba32c5182748b3454c4c4292de2d53dbfb06))
* **editor:** Differentiate default & custom sounds properly ([5232bf1](https://github.com/jchantrell/chromatic-poe/commit/5232bf1aed2a768ed5345eea4e4f2f9812d5a4a8))
* **editor:** Re-enable auto reloading ([26c9425](https://github.com/jchantrell/chromatic-poe/commit/26c94258d6a07d6291a54c45ea1baaf941b5816f))
* **editor:** Make the whole side bar button clickable ([0ef96f4](https://github.com/jchantrell/chromatic-poe/commit/0ef96f40b73a64e81e2401f1ff9185d147cdc06f))
* **editor:** Enchanted bool condition ([5c6e739](https://github.com/jchantrell/chromatic-poe/commit/5c6e73961687f914767fe3532e79132195068701))
* **editor:** Add max value of 5000 to all armour types ([8aea4a1](https://github.com/jchantrell/chromatic-poe/commit/8aea4a197dfe5c990ada9f9a9a87bccded46f06b))
* **editor:** Empty list of items shouldnt return true ([cd6def1](https://github.com/jchantrell/chromatic-poe/commit/cd6def1f2e7f81237bf9776edb4445b388c309bf))
* **editor:** Clean up state when disabling special cased branches ([d34b06c](https://github.com/jchantrell/chromatic-poe/commit/d34b06c9c060e28e7c309e216c35f2c40e69f9e8))
* **editor:** Add button for item picker in rule editor ([228103c](https://github.com/jchantrell/chromatic-poe/commit/228103c6fc38156f1abb9ad171d340745db60c67))
* **editor:** Close button in dialog windows ([34b199f](https://github.com/jchantrell/chromatic-poe/commit/34b199f7737ac1e2c8ae522d00a89ea81221848c))
* **editor:** Enforce dark mode for now ([9aba540](https://github.com/jchantrell/chromatic-poe/commit/9aba5401b1279d323f825c90172ae0c623f78330))
* **editor:** Mutual exclusivity for special cased branches ([973274b](https://github.com/jchantrell/chromatic-poe/commit/973274b0f20fab9d6a2e0bdf5b9ee73c9818ae05))
* **editor:** Item picker name collision ([065d15c](https://github.com/jchantrell/chromatic-poe/commit/065d15c765379b83b188de02987f90c770e85061))
* **editor:** Waystonetier over maptier ([832f8d2](https://github.com/jchantrell/chromatic-poe/commit/832f8d2cbbb51cf97d780df7e71b3e343a4ce5ae))
* **editor:** Signal state drift on enabled conditions ([8302dc6](https://github.com/jchantrell/chromatic-poe/commit/8302dc63f8aeb3d96f6668eb2be66e73143e40f2))
* **editor:** Remove the json preserve hack + other dead code ([0850563](https://github.com/jchantrell/chromatic-poe/commit/08505632bf8c65441c7918f08aed1d98c67ccb5b))
* **editor:** Removing undefined condition removes condition object ([3a32418](https://github.com/jchantrell/chromatic-poe/commit/3a324181f2087022f3c826cd0c644ececb5d712d))
* **editor:** Scrollable rules ([93a3956](https://github.com/jchantrell/chromatic-poe/commit/93a3956f7f6c568680a9c3ff8c6baf4a2d737a6b))
* **editor:** Socket count ([51cd729](https://github.com/jchantrell/chromatic-poe/commit/51cd7290bf15bd2265290d222ef5f0c9f31e3359))
* **editor:** Save and delete file semantics ([272aa0a](https://github.com/jchantrell/chromatic-poe/commit/272aa0a0cd57512d90e77ec19526637accb6749b))
* **editor:** Condition editor should represent current state ([6792ee6](https://github.com/jchantrell/chromatic-poe/commit/6792ee6febd0cdc788d068e2795cc107c24e0517))
* **editor:** Correct casing for minimap png import ([9df135c](https://github.com/jchantrell/chromatic-poe/commit/9df135c57ccb3bef833cbbf4438ec8adb23d2291))
* **editor:** Another attempt at fixing img path issues in gh-pages ([1b00517](https://github.com/jchantrell/chromatic-poe/commit/1b005175785a6c5c91718cb1bcf6e5c65ab318e0))
* **editor:** Beam color in drifted state ([4279762](https://github.com/jchantrell/chromatic-poe/commit/4279762d09fe45460b2cbfb0c4ccab0dfdc158c5))
* **editor:** Map icon not displaying because of gh-pages path ([8dd5643](https://github.com/jchantrell/chromatic-poe/commit/8dd5643c47ae30e5038ab5fe12e69f5779841d13))
* **editor:** Existing items not enabled in item picker ([00df2e2](https://github.com/jchantrell/chromatic-poe/commit/00df2e2dc86333a7a874df307e10604f3beb675a))
* **editor:** Attempt to fix missing map icon img ([1c963e9](https://github.com/jchantrell/chromatic-poe/commit/1c963e91250111b9b73e85f31a9802679c39bd7e))
* **editor:** Nested routing was a bad idea ([9e1157a](https://github.com/jchantrell/chromatic-poe/commit/9e1157acd4b1b3bdb74ddaa8ad43861a28d1b3e0))
* **editor:** Use base url in route ([8046110](https://github.com/jchantrell/chromatic-poe/commit/80461102088f1ed9db377c5ddb982eff7c890b71))
* **editor:** Handle paths with base url ([7e2428e](https://github.com/jchantrell/chromatic-poe/commit/7e2428ef1e229d41364a6f79eb6161b683ad5455))
* **editor:** Use grid over hacky flex solution for app container ([b3cf165](https://github.com/jchantrell/chromatic-poe/commit/b3cf16584e6c5f734dbbfd97e6d2d929555dc924))
* **editor:** Disabling a child shouldnt disable all siblings ([14d417b](https://github.com/jchantrell/chromatic-poe/commit/14d417b39652274c9012637de7873e023c22e3f6))
* **editor:** Initial inaccurate state for item picker ([d4d6197](https://github.com/jchantrell/chromatic-poe/commit/d4d6197b39a7cfb3a7478c4550ed98394af4467c))
* Import over require for tailwind config ([bbe706f](https://github.com/jchantrell/chromatic-poe/commit/bbe706f40618c0844e824a1b6337f89e370dbcf2))
* Use local gif file over external link ([132b3eb](https://github.com/jchantrell/chromatic-poe/commit/132b3eb2a5a49402771ca129362418ce69b99896))
* Comment out linux build for now ([2a357cb](https://github.com/jchantrell/chromatic-poe/commit/2a357cb2dfdcf74d51b37ffaf42487328eb644dd))
* Remove generated minimap json from src control ([cd115da](https://github.com/jchantrell/chromatic-poe/commit/cd115da65ead497e6851c0e743a80736f8790fee))
* Prevent hanging dialog after filter deletion ([d6eb696](https://github.com/jchantrell/chromatic-poe/commit/d6eb6962b6636bb5219fc8310daaba9121e729e6))
* Explicitly create dirs prior to extract ([40fdc6b](https://github.com/jchantrell/chromatic-poe/commit/40fdc6b3418f0129524bd2b1c1bf566c754a1479))
* Use relative image dir ([d68c8fd](https://github.com/jchantrell/chromatic-poe/commit/d68c8fd4c24922b5d89cb2690bd201dd0a12d8f7))

### Code Refactoring

* **core:** Dat and img fetching wip ([0ac4a1a](https://github.com/jchantrell/chromatic-poe/commit/0ac4a1a3bb988c17b4c4f409dc44f74eb8db64e6))
* **core:** More sweeping changes ([0872a9b](https://github.com/jchantrell/chromatic-poe/commit/0872a9bcbd1dc663eeb007328d4b1ddab1bb27f0))
* **dat:** Clean up dat export a bit ([2d7450e](https://github.com/jchantrell/chromatic-poe/commit/2d7450e0c7b2a17eefcce9dd32e4730709d5126d))
* **dat:** More data munging work ([a90dbce](https://github.com/jchantrell/chromatic-poe/commit/a90dbcee177e260e7d19e7e4adc85711ac695a2e))
* **editor:** Finish refactor towards condition arrays ([ec90be9](https://github.com/jchantrell/chromatic-poe/commit/ec90be901e872a1624238310d99c01a7cc368e27))
* **editor:** Improve styling for map and icon pickers ([dafac1b](https://github.com/jchantrell/chromatic-poe/commit/dafac1b4a997ab193d441dc5affbc45c393103b8))
* **editor:** Further improvements to rule/condition editor styling ([fb65322](https://github.com/jchantrell/chromatic-poe/commit/fb65322f4682a43aad138f317d66e53b2af41a4c))
* **editor:** Improve rule editing experience ([a9ad166](https://github.com/jchantrell/chromatic-poe/commit/a9ad1669d5cae73e1770bc867e01a0ca8ed7f4cb))
* **editor:** Clean up colour picker implementation ([58d7701](https://github.com/jchantrell/chromatic-poe/commit/58d770123db89541e793e78b7830b928d8e2b6f1))
* **editor:** Clean up app container and scrollable areas ([5803e5b](https://github.com/jchantrell/chromatic-poe/commit/5803e5b99fe110a67006644e3ca80749e6c4fe22))
* **editor:** Remove more dead code ([08e88f1](https://github.com/jchantrell/chromatic-poe/commit/08e88f1180468b5ea77e61e2792e6f033aadafd6))
* **editor:** Clean up and remove dead code ([3edd072](https://github.com/jchantrell/chromatic-poe/commit/3edd0724d2653feba834bfc064ffbb5029dafe20))
* Clean up handling of static assets ([cf9e607](https://github.com/jchantrell/chromatic-poe/commit/cf9e6078f6d66bfb5be9ff4cabb6363c56e744dc))
* Begin cleaning up db query ([ce7b076](https://github.com/jchantrell/chromatic-poe/commit/ce7b07694f308e505d33820f9fc813e0ca512496))

### Documentation

* Expand on development overview and instructions ([7ceb393](https://github.com/jchantrell/chromatic-poe/commit/7ceb393c403b99e3960e1ec8720c3e453f7fb9d9))
* Add acknowledgements ([7d39eeb](https://github.com/jchantrell/chromatic-poe/commit/7d39eeb40f3bc3b384d39f5fce42ca098abe1cc9))
* Make download count work ([6bdcb27](https://github.com/jchantrell/chromatic-poe/commit/6bdcb27aac64f3702dc4f98d56633fdbfd458712))
* Update README ([cd79f3a](https://github.com/jchantrell/chromatic-poe/commit/cd79f3abfb64b5d55628cf9c9d7e4611e84c023e))
* Fix inconsistent character casing ([5ff85bc](https://github.com/jchantrell/chromatic-poe/commit/5ff85bcfbeace3aca4a47608acbb4015597185ff))
* Add pre-release note and icon ([cfe47be](https://github.com/jchantrell/chromatic-poe/commit/cfe47beb845a7466d5abd4a41cbe6c3888032946))
* Add poewiki api use case ([642be65](https://github.com/jchantrell/chromatic-poe/commit/642be652fa155bba0b6d36b34d77783e57ccc5d7))

### Performance Improvements

* **editor:** Add memoizations and prevent redundant updates ([e9af0b9](https://github.com/jchantrell/chromatic-poe/commit/e9af0b996b1600bce8e6d35b563ca398c691ff92))

### Styles

* **editor:** Consistent item pickers ([d9f4724](https://github.com/jchantrell/chromatic-poe/commit/d9f4724ed327d413d40d56d13e21b8b9eee2f232))
* **editor:** Static size for item picker popover ([cbebd67](https://github.com/jchantrell/chromatic-poe/commit/cbebd67e5c1ad916cd1e6058cce1448c15ec5cf2))
* **editor:** Make rule expansion more intuitive ([7d55409](https://github.com/jchantrell/chromatic-poe/commit/7d554097d9eb31399091ffaf696f19cbca0b9b3e))
* **editor:** Enforce minimum width on rule list ([a995662](https://github.com/jchantrell/chromatic-poe/commit/a995662631e0d1ae10f11d4da9ded6141a888e97))
* Improve picker and general editor ([5e72981](https://github.com/jchantrell/chromatic-poe/commit/5e729813a6b4c619baef41145cbfe69b4e63ce7c))
* Update settings popover ([36eecbe](https://github.com/jchantrell/chromatic-poe/commit/36eecbec61df5e1917405e5f69c0dcd421498422))

### Miscellaneous Chores

* **backend:** Remove unneeded permissions ([6ad7e4d](https://github.com/jchantrell/chromatic-poe/commit/6ad7e4d892aec34e4d8505da0e7265b28a957ce6))
* **backend:** Separate out filter reload logic to its own file ([ad749b6](https://github.com/jchantrell/chromatic-poe/commit/ad749b63e36720b22da9be259768a66cd9d20501))
* **dat:** Interim bump to latest patch ([9bd4cd8](https://github.com/jchantrell/chromatic-poe/commit/9bd4cd8a56378eeb128ab17192e426bdb25e49eb))
* **dat:** Add default filter sounds to src ([2457a1f](https://github.com/jchantrell/chromatic-poe/commit/2457a1f1b1443b9220522417ed223ccfc523989c))
* **editor:** Update minimal template ([ae12de2](https://github.com/jchantrell/chromatic-poe/commit/ae12de23b095ade7ce777e7d4f08661f59e3cca7))
* **editor:** Delete redundant file ([e9ca16c](https://github.com/jchantrell/chromatic-poe/commit/e9ca16c11d2718e70331c88c4260d90b693faf14))
* **release:** V0.4.5 ([65d4849](https://github.com/jchantrell/chromatic-poe/commit/65d48498151a16223e17aadeb2ad985c7ee1ab3e))
* **release:** V0.4.4 ([3b793f4](https://github.com/jchantrell/chromatic-poe/commit/3b793f4542570ae91b51ac10eb78801639c62e4a))
* Remove unnecessary debug logs ([ed6f14a](https://github.com/jchantrell/chromatic-poe/commit/ed6f14a4bc388e6b85550f58e66d1982dc4d5ba3))
* Add remainder of changelog ([ccb7cd1](https://github.com/jchantrell/chromatic-poe/commit/ccb7cd1996eb34906a0aac6267d2fab0c2ea6408))
* Add missing job dependency ([19a1b09](https://github.com/jchantrell/chromatic-poe/commit/19a1b09a571a5b3f8c53054bb7de0c64ef8cae02))
* Fix release script ([4e450ba](https://github.com/jchantrell/chromatic-poe/commit/4e450ba22697bfc834a45e8d4d48c41d6d78167a))
* Remove debug logs ([68aae3a](https://github.com/jchantrell/chromatic-poe/commit/68aae3afd0b5fa04ed94a08bf8e89a53102cdb48))
* Add base changelog file ([5134300](https://github.com/jchantrell/chromatic-poe/commit/51343003b96bf40953a97f2fca2b31737a1bfe29))
* Add git cliff changelogs + tagged release process ([9dfeabf](https://github.com/jchantrell/chromatic-poe/commit/9dfeabf166f257c88440bc3a787eb585a9a5ad02))
* Bump to 0.4.3 ([ff194b2](https://github.com/jchantrell/chromatic-poe/commit/ff194b2ad3fb2e2d10ec4fe9cca024c99e7a854c))
* Bump to 0.4.1 ([af8ed65](https://github.com/jchantrell/chromatic-poe/commit/af8ed6536fe963a39d957fc5d2321f6b6fc8f088))
* Expose necessary secrets as env vars ([962740b](https://github.com/jchantrell/chromatic-poe/commit/962740b8dd564aa98b2ddfccc1234395ca479c30))
* Fetch current patch version from alternate source ([3404d62](https://github.com/jchantrell/chromatic-poe/commit/3404d6239f30e1900681d0b3dcfe7c17dfc3ab0e))
* Manually set patch version for now ([6fd4e8e](https://github.com/jchantrell/chromatic-poe/commit/6fd4e8ef27d74ed995914fc3599fd086b4e9c23c))
* Bump to 0.3.0 ([7a80656](https://github.com/jchantrell/chromatic-poe/commit/7a8065658b094269dbbc43e8accb49b502e752ac))
* Always fetch latest patch version ([a5f338f](https://github.com/jchantrell/chromatic-poe/commit/a5f338f7f4ab43d29816d38f374efde4bb6d73ef))
* Add nvmrc ([50d3a7d](https://github.com/jchantrell/chromatic-poe/commit/50d3a7dac80dfdfd432ffc70ad810f57d5286ec0))
* Bump to 0.2.0 ([ca63459](https://github.com/jchantrell/chromatic-poe/commit/ca63459c52a68a7f3e4d301cff45d96042699419))
* Add a showcase gif to README ([39e8e88](https://github.com/jchantrell/chromatic-poe/commit/39e8e88ce9486cd63e4287590e1af1979cf8a414))
* Update readme ([2f033bf](https://github.com/jchantrell/chromatic-poe/commit/2f033bfa2a2157ab0445d7fbcee7537bfde4e65b))
* Add missing permissions for gh-pages ([15aa36d](https://github.com/jchantrell/chromatic-poe/commit/15aa36d9b62ba4724d078c22c5cb8d4051e75b8c))
* Merge to one action and add concurrency limit ([5db6fe8](https://github.com/jchantrell/chromatic-poe/commit/5db6fe87f2e920a326896cfbc6d33be6e386482d))
* Clean up dependencies ([3a33904](https://github.com/jchantrell/chromatic-poe/commit/3a3390415e648fce52eb1baf33a581be2feeceb4))
* Add cache to imagemagick step and renable ubuntu build ([2264eb9](https://github.com/jchantrell/chromatic-poe/commit/2264eb9c16af0beaf2cbd1cbdf41866bb4ec3c2b))
* Get latest imagemagick version ([1808dd8](https://github.com/jchantrell/chromatic-poe/commit/1808dd870c25f1f8523137ed7c4e6fa533276122))
* Fix duplicate step id ([c60b8ab](https://github.com/jchantrell/chromatic-poe/commit/c60b8abab250bd0a505d12c6786ec456ea237c87))
* Separate gh-pages deploy to another action ([5cb2de9](https://github.com/jchantrell/chromatic-poe/commit/5cb2de9016c75c49f4febaae9c2291bad383f44f))
* Specify pnpm version ([9bc7900](https://github.com/jchantrell/chromatic-poe/commit/9bc7900aec1e54b8cfdec5c200048cb537e71381))
* Install pnpm before attempting build ([ca21ad6](https://github.com/jchantrell/chromatic-poe/commit/ca21ad693f10a8cd60367c31aeedaaecf076505e))
* Fix gh pages path issue ([191fe7c](https://github.com/jchantrell/chromatic-poe/commit/191fe7caa617477616cad3ae01516ccf1a7b8c84))
* Give write permissions to the correct job ([57a3007](https://github.com/jchantrell/chromatic-poe/commit/57a30076731960b89ec83b719b93bd0ad61632a7))
* Add missing permissions for gh pages ([cdc0d04](https://github.com/jchantrell/chromatic-poe/commit/cdc0d041dd8f227e8064bbdd4edf9b8e124fea40))
* Publish artifact to github pages ([f2db963](https://github.com/jchantrell/chromatic-poe/commit/f2db963d43d7c7b289e1460eb7251b137608be1d))
* Add README ([8f44d12](https://github.com/jchantrell/chromatic-poe/commit/8f44d12b965046943508bd61e78baad3da5bb4cb))
* Disable light theme and delete unused file ([2213972](https://github.com/jchantrell/chromatic-poe/commit/2213972512efa8968dd82573a5d4db1c4e63c54b))
* Update dependencies ([dd10388](https://github.com/jchantrell/chromatic-poe/commit/dd1038810d83fa8fc3975d5be6552fb567bc3ab7))
* Run workflow on push to main ([edea383](https://github.com/jchantrell/chromatic-poe/commit/edea383b9e5ac691af1229c2f5a44f0786b067f1))
* Use choco over winget ([d655c0f](https://github.com/jchantrell/chromatic-poe/commit/d655c0ff50259f4359ab378d2e6cc973a8fc2933))
* Install imagemagick prior to extract ([52e4db1](https://github.com/jchantrell/chromatic-poe/commit/52e4db1aa0e9ba31c01c255e647e62eafb1a7c84))
* Global install pathofexile-dat ([35d4fcc](https://github.com/jchantrell/chromatic-poe/commit/35d4fcc711249145bd4e79605ecd2f9831c1f15d))
* Convert to single shell script for game file extract ([ce581fa](https://github.com/jchantrell/chromatic-poe/commit/ce581fabb9b23c91cdcb5e2b09c18b30ea6f0912))
* Set default shell to bash ([f3ef7ef](https://github.com/jchantrell/chromatic-poe/commit/f3ef7ef80ae6c23c0e90f3024fd1915c96a74605))
* Preserve spritesheet dir ([14cbdaf](https://github.com/jchantrell/chromatic-poe/commit/14cbdaf1554c99512698c18c99594ddd1a120eac))
* Add workflow steps to fetch & extract game files ([b8eef65](https://github.com/jchantrell/chromatic-poe/commit/b8eef6500a0fbe1c989939af84609a68990e6b18))
* Add github workflow for builds ([2fa9c1d](https://github.com/jchantrell/chromatic-poe/commit/2fa9c1d0d17bdcbf5a449c5772f1a57ba3d24208))

### Reverts

* "revert: "fix(dat): special case wailing wall unique basetype"" ([7c743a8](https://github.com/jchantrell/chromatic-poe/commit/7c743a8180fbec87d1596aa50819340c8ff52c53))
* "fix(dat): special case wailing wall unique basetype" ([d21fed6](https://github.com/jchantrell/chromatic-poe/commit/d21fed6c530a0d2a7dc98a103e7f0d7ce5b3611f))

### Core

* Basic filter styling ([6dbde4b](https://github.com/jchantrell/chromatic-poe/commit/6dbde4b35e4bc63f6fcfba6177bcb6bea1e24f70))
* Working drag drop + undo redos ([6cfdd81](https://github.com/jchantrell/chromatic-poe/commit/6cfdd819534b01680e8c46a8527998387aa9e8c4))
* Migrate to mobx ([71a66f4](https://github.com/jchantrell/chromatic-poe/commit/71a66f444b3939ba9f643c1a081f86d40aa573f0))
* Clean refactor ([cb210e3](https://github.com/jchantrell/chromatic-poe/commit/cb210e3559c83761debbf32fd7afa135e26091ec))
* Undos/redos and drag and drop improvements ([140c48d](https://github.com/jchantrell/chromatic-poe/commit/140c48d8f31190ebf161765f4149743ca7861eff))
* Drap/drop + sorting & basic filter serialisation ([8e3b3bd](https://github.com/jchantrell/chromatic-poe/commit/8e3b3bdd839aff97d0ab13984c70ba2715be9443))
* Db and category ui improvements ([8013065](https://github.com/jchantrell/chromatic-poe/commit/8013065d5c76d0e18efd663e8f8e4fbb5fed28dd))
* File system improvements ([7f228ff](https://github.com/jchantrell/chromatic-poe/commit/7f228ff2816210ec2bffc21b0775431e92f0f121))
* Load screen and storage improvements ([22c0b1c](https://github.com/jchantrell/chromatic-poe/commit/22c0b1c2f23f5a5165955b5c863d5b22f861813e))
* Initial commit ([a99e44a](https://github.com/jchantrell/chromatic-poe/commit/a99e44a98a2b1ef73a0d34cd2ca5599b672672ef))
