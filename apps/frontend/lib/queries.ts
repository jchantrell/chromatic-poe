export enum TableNames {
  BaseItemTypes = "BaseItemTypes",
  ItemVisualIdentity = "ItemVisualIdentity",
  ItemClasses = "ItemClasses",
  ItemClassCategories = "ItemClassCategories",
  CurrencyExchange = "CurrencyExchange",
  CurrencyExchangeCategories = "CurrencyExchangeCategories",
  SkillGems = "SkillGems",
  GemEffects = "GemEffects",
  ArmourTypes = "ArmourTypes",
  WeaponTypes = "WeaponTypes",
  CurrencyItems = "CurrencyItems",
  Words = "Words",
  UniqueStashLayout = "UniqueStashLayout",
  UniqueStashTypes = "UniqueStashTypes",
  Tags = "Tags",
  Mods = "Mods",
  ModType = "ModType",
  Stats = "Stats",
  AttributeRequirements = "AttributeRequirements",
  MinimapIcons = "MinimapIcons",
}

export const TABLES = Object.values(TableNames);

export const extraFields = `
art,
height,
width,
gemFx,
class as itemClass,
name as base
`;

export const V1_ITEMS_QUERY = `
WITH ITEMS AS (
  SELECT DISTINCT
  ${TableNames.BaseItemTypes}.Name as 'name',
  ${TableNames.ItemClasses}.Name as 'class',
  ${TableNames.ItemClassCategories}.Text as 'category',
  ${TableNames.ItemVisualIdentity}.DDSFile as 'art',
  exchange_major.Name as 'exchangeCategory',
  exchange_sub.Name as 'exchangeSubCategory',

  ${TableNames.CurrencyExchange}.GoldPurchaseFee as 'price',
  ${TableNames.SkillGems}.StrengthRequirementPercent as 'strReq',
  ${TableNames.SkillGems}.DexterityRequirementPercent as 'dexReq',
  ${TableNames.SkillGems}.IntelligenceRequirementPercent as 'intReq',

  (${TableNames.ArmourTypes}.ArmourMin + ${TableNames.ArmourTypes}.ArmourMax) / 2 as 'armour',
  (${TableNames.ArmourTypes}.EvasionMin + ${TableNames.ArmourTypes}.EvasionMax) / 2 as 'evasion',
  (${TableNames.ArmourTypes}.EnergyShieldMin + ${TableNames.ArmourTypes}.EnergyShieldMax) / 2 as 'energyShield',
  (${TableNames.ArmourTypes}.WardMin + ${TableNames.ArmourTypes}.WardMax) / 2 as 'ward',

  ${TableNames.WeaponTypes}.DamageMin as 'dmgMin',
  ${TableNames.WeaponTypes}.DamageMax as 'dmgMax',
  ${TableNames.WeaponTypes}.Speed as 'speed',

  ${TableNames.BaseItemTypes}.Height as 'height',
  ${TableNames.BaseItemTypes}.Width as 'width',

  ${TableNames.ItemClasses}.CanBeCorrupted as corruptable,
  (CASE
    WHEN ${TableNames.CurrencyItems}.StackSize IS NOT NULL
    AND ${TableNames.CurrencyItems}.StackSize > 1
    THEN 1
    ELSE 0
  END) as stackable,

  ${TableNames.SkillGems}.GemEffects as 'gemFx',
  ${TableNames.BaseItemTypes}.DropLevel as 'dropLevel'

  FROM ${TableNames.BaseItemTypes}

  LEFT JOIN ${TableNames.ItemClasses}
  ON ${TableNames.BaseItemTypes}.ItemClassesKey = ${TableNames.ItemClasses}._index

  LEFT JOIN ${TableNames.ItemClassCategories}
  ON ${TableNames.ItemClasses}.ItemClassCategory = ${TableNames.ItemClassCategories}._index

  LEFT JOIN ${TableNames.ItemVisualIdentity}
  ON ${TableNames.BaseItemTypes}.ItemVisualIdentity = ${TableNames.ItemVisualIdentity}._index

  LEFT JOIN ${TableNames.CurrencyExchange}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.CurrencyExchange}.Item

  LEFT JOIN ${TableNames.CurrencyExchangeCategories} as exchange_major
  ON ${TableNames.CurrencyExchange}.Category = exchange_major._index

  LEFT JOIN ${TableNames.CurrencyExchangeCategories} as exchange_sub
  ON ${TableNames.CurrencyExchange}.SubCategory = exchange_sub._index

  LEFT JOIN ${TableNames.ArmourTypes}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.ArmourTypes}.BaseItemTypesKey

  LEFT JOIN ${TableNames.WeaponTypes}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.WeaponTypes}.BaseItemTypesKey

  LEFT JOIN ${TableNames.SkillGems}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.SkillGems}.BaseItemTypesKey

  LEFT JOIN ${TableNames.CurrencyItems}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.CurrencyItems}.BaseItemTypesKey

  WHERE ${TableNames.BaseItemTypes}.Name != '' AND ${TableNames.BaseItemTypes}.Name IS NOT NULL
)

-- Weapons
SELECT DISTINCT
name,
'Weapons' AS category,
class,
null as type,
(dmgMin + dmgMax) / 2 * (1000 / speed) AS score,
${extraFields}
FROM ITEMS
WHERE category IN ('Two Hand Sword', 'Two Hand Axe', 'Two Hand Mace', 'One Hand Sword', 'One Hand Axe', 'One Hand Mace', 'Bow', 'Crossbow', 'Wand', 'Staff', 'Claw', 'Sceptre', 'Spear', 'Dagger')

UNION ALL

-- Offhands
SELECT DISTINCT
name,
'Off-hands' AS category,
class,
(CASE
  WHEN armour != 0 AND evasion != 0
  THEN 'Strength/Dexterity'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Strength/Intelligence'
  WHEN armour != 0
  THEN 'Strength'
  WHEN evasion != 0
  THEN 'Dexterity'
  WHEN energyShield != 0
  THEN 'Intelligence'
  WHEN class in ('Quivers')
  THEN 'Dexterity'
  ELSE 'Unknown'
END) AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Shield', 'Foci', 'Quiver') 

UNION ALL

-- Armour
SELECT DISTINCT
name,
'Armour' AS category,
class,
(CASE
  WHEN armour != 0 AND evasion != 0 AND energyShield != 0
  THEN 'Miscellaneous'
  WHEN ward != 0
  THEN 'Ward'
  WHEN armour != 0 AND evasion != 0
  THEN 'Strength/Dexterity'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Strength/Intelligence'
  WHEN evasion != 0 AND energyShield != 0
  THEN 'Dexterity/Intelligence'
  WHEN armour != 0
  THEN 'Strength'
  WHEN evasion != 0
  THEN 'Dexterity'
  WHEN energyShield != 0
  THEN 'Intelligence'
  ELSE 'Miscellaneous'
END) AS type,
armour + evasion + energyShield + ward AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Helmet', 'Body Armour', 'Boots', 'Gloves')

UNION ALL

-- Jewellery
SELECT DISTINCT
name,
'Jewellery' AS category,
class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Ring', 'Amulet', 'Belt')

UNION ALL

-- Flasks
SELECT DISTINCT
name,
'Flasks' AS category,
class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Flask', 'Tincture') 

UNION ALL

-- Jewels
SELECT DISTINCT
name,
'Jewels' AS category,
(CASE
  WHEN name LIKE '%Cluster%'
  THEN 'Cluster'
  WHEN name LIKE 'Timeless%'
  THEN 'Timeless'
  WHEN name LIKE '%Eye Jewel'
  THEN 'Abyss'
  ELSE 'Common'
END) as class,
(CASE
  WHEN name LIKE '%Cluster%'
  THEN 'Cluster'
  WHEN name LIKE 'Timeless%'
  THEN 'Timeless'
  WHEN name LIKE '%Eye Jewel'
  THEN 'Abyss'
  ELSE 'Common'
END) as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Jewel', 'Abyss Jewel')

UNION ALL

-- Pieces
SELECT DISTINCT
name,
'Uniques' AS category,
'Pieces' as class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Pieces'


UNION ALL

-- Gems
SELECT DISTINCT
name,
'Gems' AS category,
(CASE
  WHEN name LIKE 'Awakened%'
  THEN 'Awakened'
  WHEN name LIKE 'Vaal%' AND category = 'Skill Gem'
  THEN 'Vaal'
  WHEN class = 'Skill Gems'
  THEN 'Active'
  WHEN class = 'Support Gems'
  THEN 'Support'
  ELSE 'Unknown'
END) as class,
(CASE
  WHEN strReq != 0 AND dexReq != 0 AND intReq != 0
  THEN 'Hybrid'
  WHEN strReq != 0 AND dexReq != 0
  THEN 'Strength/Dexterity'
  WHEN strReq != 0 AND intReq != 0
  THEN 'Strength/Intelligence'
  WHEN intReq != 0 AND dexReq != 0
  THEN 'Dexterity/Intelligence'
  WHEN strReq != 0
  THEN 'Strength'
  WHEN dexReq != 0
  THEN 'Dexterity'
  WHEN intReq != 0
  THEN 'Intelligence'
  ELSE 'Unknown'
END) as type,
strReq + dexReq + intReq AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Skill Gem', 'Support Gem') AND name NOT LIKE '%]%' AND name NOT IN ('Coming Soon', 'Shroud', 'WIP Support', 'Vaal Soul Harvesting')

UNION ALL

-- Lifeforce
SELECT DISTINCT
name,
'Currency' AS category,
'Lifeforce' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Lifeforce'

UNION ALL

-- Divination Cards
SELECT DISTINCT
name,
'Divination Cards' AS category,
(CASE
 WHEN exchangeSubCategory like 'Divination Cards Rewarding%'
 THEN SUBSTR(exchangeSubCategory, 27)
 ELSE 'Other'
END) as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Divination Cards'

UNION ALL

-- Maps
SELECT DISTINCT
name,
'Maps' AS category,
class,
(CASE
  WHEN name LIKE 'Shaped%'
  THEN 'Shaped'
  WHEN name IN ('Pit of the Chimera Map', 'Lair of the Hydra Map', 'Maze of the Minotaur Map', 'Forge of the Phoenix Map')
  THEN 'Guardian'
  WHEN name IN ('Harbinger Map', 'Engraved Ultimatum', 'Vaal Temple Map')
  THEN 'Special'
  WHEN name IN ('Citadel Map', 'Fortress Map', 'Abomination Map', 'Ziggurat Map')
  THEN 'Tier 17'
  ELSE 'Common'
END) as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Maps' AND name != 'The Shaper''s Realm'

UNION ALL

-- Scarabs
SELECT DISTINCT
name,
'Scarabs' as category,
exchangeSubCategory as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Scarabs'

UNION ALL

-- Fragments
SELECT DISTINCT
name,
'Fragments' AS category,
exchangeSubCategory as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Fragments'


UNION ALL

-- Heist
SELECT DISTINCT
name,
'Leagues' as category,
'Heist' AS class,
class as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Heist Gear', 'Heist Tool', 'Heist Cloak', 'Heist Brooch', 'Blueprint', 'Trinket', 'Contract', 'Heist Target') AND name NOT LIKE '[UNUSED]%'


UNION ALL

-- Omens
SELECT DISTINCT
name,
'Leagues' AS category,
'Omens' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Omens'

UNION ALL

-- Delve
SELECT DISTINCT
name,
'Leagues' as category,
'Delve' AS class,
exchangeSubCategory as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Delve'

UNION ALL

-- Catalysts
SELECT DISTINCT
name,
'Currency' AS category,
exchangeSubCategory as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Catalysts'


UNION ALL

-- Tattoos
SELECT DISTINCT
name,
'Leagues' as category,
'Tattoos' AS class,
(CASE
  WHEN exchangeSubCategory LIKE 'Dexterity%'
  THEN 'Dexterity'
  WHEN exchangeSubCategory LIKE 'Intelligence%'
  THEN 'Intelligence'
  WHEN exchangeSubCategory LIKE 'Strength%'
  THEN 'Strength'
  ELSE 'Unknown'
END)as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Tattoos'

UNION ALL

-- Runes
SELECT DISTINCT
name,
'Leagues' as category,
'Runes' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Runegrafts'

UNION ALL

-- Oils
SELECT DISTINCT
name,
'Leagues' AS category,
'Oils' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Oils'


UNION ALL


-- Currency
SELECT DISTINCT
name,
exchangeCategory AS category,
(CASE
  WHEN exchangeSubCategory = exchangeCategory
  THEN 'Common'
  ELSE exchangeSubCategory
END) as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Currency')

UNION ALL

-- Essence
SELECT DISTINCT
name,
'Currency' as category,
exchangeCategory AS class,
(CASE
  WHEN exchangeSubCategory = exchangeCategory
  THEN 'Common'
  ELSE exchangeSubCategory
END) as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Essences')

UNION ALL

-- Special cased currency
SELECT DISTINCT
name,
'Currency' AS category,
'Common' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Albino Rhoa Feather')

UNION ALL

-- Incubators
SELECT DISTINCT
name,
'Leagues' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Incubators'

UNION ALL

-- Timeless Domain
SELECT DISTINCT
name,
'Fragments' AS category,
'Legion Splinters' as class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Timeless Eternal Empire Splinter', 'Timeless Karui Splinter', 'Timeless Templar Splinter', 'Timeless Vaal Splinter', 'Timeless Maraketh Splinter')

UNION ALL

SELECT DISTINCT
name,
'Fragments' AS category,
'Legion Emblems' as class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Timeless Eternal Emblem', 'Timeless Karui Emblem', 'Timeless Templar Emblem', 'Timeless Vaal Emblem', 'Timeless Maraketh Emblem','Unrelenting Timeless Eternal Emblem', 'Unrelenting Timeless Karui Emblem', 'Unrelenting Timeless Templar Emblem', 'Unrelenting Timeless Vaal Emblem', 'Unrelenting Timeless Maraketh Emblem')

UNION ALL

-- Expedition
SELECT DISTINCT
name,
'Fragments' AS category,
'Expedition Logbook' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Expedition Logbooks'

UNION ALL

SELECT DISTINCT
name,
'Currency' AS category,
'Expedition' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Expedition'

UNION ALL

-- Ultimatum
SELECT DISTINCT
name,
'Ultimatum' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeSubCategory = 'Ultimatum Fragments'
OR class = 'Inscribed Ultimatum'

UNION ALL

-- Sanctum
SELECT DISTINCT
name,
'Fragments' AS category,
'Sanctum' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'Forbidden Tome'

UNION ALL

-- Idols
SELECT DISTINCT
name,
'Leagues' as category,
'Idols' AS class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category = 'Idol'

UNION ALL

SELECT DISTINCT
name,
'Leagues' AS category,
'Sanctum Relics' as class,
'Sanctum Relics' as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Relics' AND name NOT LIKE '[DO NOT USE]%'

UNION ALL

-- Delirium, Breach
SELECT DISTINCT
name,
'Fragments' AS category,
exchangeCategory as class,
exchangeSubCategory as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Delirium', 'Breach')

UNION ALL

SELECT DISTINCT
name,
'Currency' AS category,
'Gold' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'Gold'

UNION ALL

-- Corpses
SELECT DISTINCT
name,
'Leagues' AS category,
class,
(CASE
WHEN name like '%Hydra'
 THEN 'Hydra'
 WHEN name like '%Frozen Cannibal'
 THEN 'Frozen Cannibal'
 WHEN name like '%Fiery Cannibal'
 THEN 'Fiery Cannibal'
 WHEN name like '%Dark Marionette'
 THEN 'Dark Marionette'
 WHEN name like '%Naval Officer'
 THEN 'Naval Officer'
 WHEN name like '%Dancing Sword'
 THEN 'Dancing Sword'
 WHEN name like '%Needle Horror'
 THEN 'Needle Horror'
 WHEN name like '%Serpent Warrior'
 THEN 'Serpent Warrior'
 WHEN name like '%Pain Artist'
 THEN 'Pain Artist'
 WHEN name like '%Sawblade Horror'
 THEN 'Sawblade Horror'
 WHEN name like '%Blood Demon'
 THEN 'Blood Demon'
 WHEN name like '%Slashing Horror'
 THEN 'Slashing Horror'
 WHEN name like '%Druidic Alchemist'
 THEN 'Druidic Alchemist'
 WHEN name like '%Blasphemer'
 THEN 'Blasphemer'
 WHEN name like '%Judgemental Spirit'
 THEN 'Judgemental Spirit'
 WHEN name like '%Primal Thunderbird'
 THEN 'Primal Thunderbird'
 WHEN name like '%Spirit of Fortune'
 THEN 'Spirit of Fortune'
 WHEN name like '%Primal Demiurge'
 THEN 'Primal Demiurge'
 WHEN name like '%Runic Skeleton'
 THEN 'Runic Skeleton'
 WHEN name like '%Warlord'
 THEN 'Warlord'
 WHEN name like '%Dark Reaper'
 THEN 'Dark Reaper'
 WHEN name like '%Hulking Miscreation'
 THEN 'Hulking Miscreation'
 WHEN name like '%Sanguimancer Demon'
 THEN 'Sanguimancer Demon'
 WHEN name like '%Shadow Berserker'
 THEN 'Shadow Berserker'
 WHEN name like '%Spider Matriarch'
 THEN 'Spider Matriarch'
 WHEN name like '%Half-remembered Goliath'
 THEN 'Half-remembered Goliath'
 WHEN name like '%Meatsack'
 THEN 'Meatsack'
 WHEN name like '%Eldritch Eye'
 THEN 'Eldritch Eye'
 WHEN name like '%Guardian Turtle'
 THEN 'Guardian Turtle'
 WHEN name like '%Shadow Construct'
 THEN 'Shadow Construct'
 WHEN name like '%Forest Tiger'
 THEN 'Forest Tiger'
 WHEN name like '%Forest Warrior' 
 THEN 'Forest Warrior' 
 WHEN name like '%Restless Knight' 
 THEN 'Restless Knight' 
 WHEN name like '%Riftcaster' 
 THEN 'Riftcaster' 
 WHEN name like '%Escaped Prototype' 
 THEN 'Escaped Prototype' 
 ELSE 'Unknown'
END) AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Corpses'


UNION ALL

-- Vault Keys
SELECT DISTINCT
name,
'Currency' AS category,
'Vault Keys' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Vault Keys'
`;

export const V2_ITEMS_QUERY = `
WITH ITEMS AS (
  SELECT DISTINCT
  ${TableNames.BaseItemTypes}.Name as 'name',
  ${TableNames.ItemClasses}.Name as 'class',
  ${TableNames.ItemClassCategories}.Text as 'category',
  ${TableNames.ItemVisualIdentity}.DDSFile as 'art',
  exchange_major.Name as 'exchangeCategory',
  exchange_sub.Name as 'exchangeSubCategory',

  ${TableNames.CurrencyExchange}.GoldPurchaseFee as 'price',
  
  -- Use COALESCE for V2 requirement logic
  COALESCE(
    ${TableNames.AttributeRequirements}.ReqStr,
    ${TableNames.SkillGems}.StrengthRequirementPercent
  ) as 'strReq',
  COALESCE(
    ${TableNames.AttributeRequirements}.ReqDex,
    ${TableNames.SkillGems}.DexterityRequirementPercent
  ) as 'dexReq',
  COALESCE(
    ${TableNames.AttributeRequirements}.ReqInt,
    ${TableNames.SkillGems}.IntelligenceRequirementPercent
  ) as 'intReq',

  ${TableNames.ArmourTypes}.Armour as 'armour',
  ${TableNames.ArmourTypes}.Evasion as 'evasion',
  ${TableNames.ArmourTypes}.EnergyShield as 'energyShield',
  ${TableNames.ArmourTypes}.Ward as 'ward',

  ${TableNames.WeaponTypes}.DamageMin as 'dmgMin',
  ${TableNames.WeaponTypes}.DamageMax as 'dmgMax',
  ${TableNames.WeaponTypes}.Speed as 'speed',

  ${TableNames.BaseItemTypes}.Height as 'height',
  ${TableNames.BaseItemTypes}.Width as 'width',

  ${TableNames.ItemClasses}.CanBeCorrupted as corruptable,
  (CASE
    WHEN ${TableNames.CurrencyItems}.StackSize IS NOT NULL
    AND ${TableNames.CurrencyItems}.StackSize > 1
    THEN 1
    ELSE 0
  END) as stackable,

  ${TableNames.SkillGems}.GemEffects as 'gemFx',
  ${TableNames.BaseItemTypes}.DropLevel as 'dropLevel'

  FROM ${TableNames.BaseItemTypes}

  LEFT JOIN ${TableNames.ItemClasses}
  ON ${TableNames.BaseItemTypes}.ItemClass = ${TableNames.ItemClasses}._index

  LEFT JOIN ${TableNames.ItemClassCategories}
  ON ${TableNames.ItemClasses}.ItemClassCategory = ${TableNames.ItemClassCategories}._index

  LEFT JOIN ${TableNames.ItemVisualIdentity}
  ON ${TableNames.BaseItemTypes}.ItemVisualIdentity = ${TableNames.ItemVisualIdentity}._index

  LEFT JOIN ${TableNames.CurrencyExchange}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.CurrencyExchange}.Item

  LEFT JOIN ${TableNames.CurrencyExchangeCategories} as exchange_major
  ON ${TableNames.CurrencyExchange}.Category = exchange_major._index

  LEFT JOIN ${TableNames.CurrencyExchangeCategories} as exchange_sub
  ON ${TableNames.CurrencyExchange}.SubCategory = exchange_sub._index
  
  LEFT JOIN ${TableNames.AttributeRequirements}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.AttributeRequirements}.BaseItemType

  LEFT JOIN ${TableNames.ArmourTypes}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.ArmourTypes}.BaseItemType

  LEFT JOIN ${TableNames.WeaponTypes}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.WeaponTypes}.BaseItemType

  LEFT JOIN ${TableNames.SkillGems}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.SkillGems}.BaseItemType

  LEFT JOIN ${TableNames.CurrencyItems}
  ON ${TableNames.BaseItemTypes}._index = ${TableNames.CurrencyItems}.BaseItemType

  WHERE ${TableNames.BaseItemTypes}.Name != '' AND ${TableNames.BaseItemTypes}.Name IS NOT NULL
)

-- Weapons
SELECT DISTINCT
name,
'Weapons' AS category,
class,
null as type,
(dmgMin + dmgMax) / 2 * (1000 / speed) AS score,
${extraFields}
FROM ITEMS
WHERE category IN ('One Handed Weapons', 'Two Handed Weapons')

UNION ALL

-- Offhands
SELECT DISTINCT
name,
'Off-hands' AS category,
class,
(CASE
  WHEN armour != 0 AND evasion != 0
  THEN 'Strength/Dexterity'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Strength/Intelligence'
  WHEN armour != 0
  THEN 'Strength'
  WHEN evasion != 0
  THEN 'Dexterity'
  WHEN energyShield != 0
  THEN 'Intelligence'
  WHEN class in ('Quivers')
  THEN 'Dexterity'
  ELSE 'Unknown'
END) AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Off-hand') OR class = 'Foci'

UNION ALL

-- Armour
SELECT DISTINCT
name,
'Armour' AS category,
class,
(CASE
  WHEN armour != 0 AND evasion != 0 AND energyShield != 0
  THEN 'Miscellaneous'
  WHEN ward != 0
  THEN 'Ward'
  WHEN armour != 0 AND evasion != 0
  THEN 'Strength/Dexterity'
  WHEN armour != 0 AND energyShield != 0
  THEN 'Strength/Intelligence'
  WHEN evasion != 0 AND energyShield != 0
  THEN 'Dexterity/Intelligence'
  WHEN armour != 0
  THEN 'Strength'
  WHEN evasion != 0
  THEN 'Dexterity'
  WHEN energyShield != 0
  THEN 'Intelligence'
  ELSE 'Miscellaneous'
END) AS type,
armour + evasion + energyShield + ward AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Armour')
AND ((name LIKE 'Expert %' OR name LIKE 'Advanced %') OR dropLevel < 45)

UNION ALL

-- Jewellery
SELECT DISTINCT
name,
'Jewellery' AS category,
class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Jewellery')

UNION ALL

-- Flasks
SELECT DISTINCT
name,
'Flasks' AS category,
class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Flasks') AND class != 'Charms'

UNION ALL

-- Charms
SELECT DISTINCT
name,
'Charms' AS category,
(CASE
  WHEN name IN ('Thawing Charm', 'Shivering Charm', 'Antidote Charm', 'Dousing Charm', 'Grounding Charm', 'Stone Charm', 'Silver Charm', 'Staunching Charm')
  THEN 'Ailment'
  WHEN name IN ('Ruby Charm', 'Sapphire Charm', 'Topaz Charm', 'Amethyst Charm')
  THEN 'Resist'
  ELSE 'Other'
END) as class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Charms'

UNION ALL

-- Gems
SELECT DISTINCT
name,
'Gems' AS category,
class,
(CASE
  WHEN strReq != 0 AND dexReq != 0 AND intReq != 0
  THEN 'Hybrid'
  WHEN strReq != 0 AND dexReq != 0
  THEN 'Strength/Dexterity'
  WHEN strReq != 0 AND intReq != 0
  THEN 'Strength/Intelligence'
  WHEN intReq != 0 AND dexReq != 0
  THEN 'Dexterity/Intelligence'
  WHEN strReq != 0
  THEN 'Strength'
  WHEN dexReq != 0
  THEN 'Dexterity'
  WHEN intReq != 0
  THEN 'Intelligence'
  ELSE 'Unknown'
END) as type,
strReq + dexReq + intReq AS score, 
${extraFields}
FROM ITEMS
WHERE category IN ('Gems') AND name NOT LIKE '[DNT]%' AND name NOT IN ('Coming Soon', 'Shroud')

UNION ALL

SELECT DISTINCT
name,
'Gems' AS category,
'Uncut' AS class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Uncut Skill Gem', 'Uncut Support Gem', 'Uncut Spirit Gem')

UNION ALL

-- Jewels
SELECT DISTINCT
name,
'Jewels' AS category,
class,
(CASE
  WHEN name LIKE 'Time-Lost%'
  THEN 'Special'
  WHEN name LIKE 'Timeless%'
  THEN 'Special'
  ELSE 'Common'
END) as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Jewels'

UNION ALL

-- Maps
SELECT DISTINCT
name,
'Maps' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Waystones'

UNION ALL

-- Tablets
SELECT DISTINCT
name,
'Maps' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Tablet'

UNION ALL

-- Currency, Essence 
SELECT DISTINCT
name,
exchangeCategory AS category,
(CASE
  WHEN exchangeSubCategory = exchangeCategory
  THEN 'Common'
  ELSE exchangeSubCategory
END) as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Essences', 'Currency')

UNION ALL

-- Special cased currency
SELECT DISTINCT
name,
'Currency' AS category,
'Common' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Albino Rhoa Feather')

UNION ALL

-- Expedition
SELECT DISTINCT
name,
'Expedition' AS category,
'Logbook' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Expedition Logbooks'

UNION ALL

SELECT DISTINCT
name,
'Expedition' AS category,
'Currency' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Exotic Coinage', 'Sun Artifact', 'Broken Circle Artifact', 'Black Scythe Artifact', 'Order Artifact')

UNION ALL

-- Ultimatum
SELECT DISTINCT
name,
'Ultimatum' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeSubCategory = 'Ultimatum Fragments'
OR class = 'Inscribed Ultimatum'

UNION ALL

SELECT DISTINCT
name,
'Ultimatum' AS category,
'Soul Cores' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Soul Cores'

UNION ALL

-- Sekhema
SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Trial Coins'

UNION ALL

SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Relics'

UNION ALL

SELECT DISTINCT
name,
'Trial of the Sekhemas' AS category,
'Keys' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Gold Key', 'Silver Key', 'Bronze Key')

UNION ALL

-- Ritual
SELECT DISTINCT
name,
'Ritual' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'An Audience with the King'

UNION ALL

-- Ritual
SELECT DISTINCT
name,
'Ritual' AS category,
class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Omen'

UNION ALL

-- Delirium, Breach
SELECT DISTINCT
name,
exchangeCategory AS category,
(CASE
  WHEN exchangeSubCategory = exchangeCategory
  THEN 'Fragments'
  ELSE exchangeSubCategory
END) as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory IN ('Delirium', 'Breach')

UNION ALL

SELECT DISTINCT
name,
'Currency' AS category,
'Common' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'Gold'

UNION ALL

-- Boss Fragments
SELECT DISTINCT
name,
'Pinnacle' AS category,
'Fragments' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeSubCategory IN ('Pinnacle Fragments')

UNION ALL

-- Vault Keys
SELECT DISTINCT
name,
'Currency' AS category,
'Vault Keys' AS class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Vault Keys'
`;

const V1_UNIQUES_QUERY = `
SELECT DISTINCT
${TableNames.Words}.Text as name,
'Uniques' as category,
${TableNames.UniqueStashTypes}.Name as class,
null as type,
0 AS score, 
Visuals.DDSFile as art,
null as height,
null as width,
null as gemFx,
null as itemClass
FROM ${TableNames.UniqueStashLayout}
LEFT JOIN ${TableNames.UniqueStashTypes}
ON ${TableNames.UniqueStashLayout}.UniqueStashTypesKey = ${TableNames.UniqueStashTypes}._index
LEFT JOIN ${TableNames.Words}
ON ${TableNames.UniqueStashLayout}.WordsKey = ${TableNames.Words}._index
LEFT JOIN ${TableNames.ItemVisualIdentity} AS Visuals
ON ${TableNames.UniqueStashLayout}.ItemVisualIdentityKey = Visuals._index
WHERE ${TableNames.UniqueStashLayout}.IsAlternateArt = 0 AND
${TableNames.UniqueStashLayout}.RenamedVersion IS NULL
`;

const V2_UNIQUES_QUERY = `
SELECT DISTINCT
${TableNames.Words}.Text as name,
'Uniques' as category,
${TableNames.UniqueStashTypes}.Name as class,
null as type,
0 AS score, 
Visuals.DDSFile as art,
null as height,
null as width,
null as gemFx,
null as itemClass
FROM ${TableNames.UniqueStashLayout}
LEFT JOIN ${TableNames.UniqueStashTypes}
ON ${TableNames.UniqueStashLayout}.UniqueStashTypesKey = ${TableNames.UniqueStashTypes}._index
LEFT JOIN ${TableNames.Words}
ON ${TableNames.UniqueStashLayout}.WordsKey = ${TableNames.Words}._index
LEFT JOIN ${TableNames.ItemVisualIdentity} AS Visuals
ON ${TableNames.UniqueStashLayout}.ItemVisualIdentityKey = Visuals._index
WHERE ${TableNames.UniqueStashLayout}.IsAlternateArt = 0 AND
${TableNames.UniqueStashLayout}.RenamedVersion IS NULL
`;

export function getQuery(patch: string, name: string): string {
  const isV2 = patch.startsWith("4.");

  let query = "";
  if (name === "items") {
    query = isV2 ? V2_ITEMS_QUERY : V1_ITEMS_QUERY;
  }

  if (name === "mods") {
    query = `SELECT * FROM ${TableNames.Mods}`;
  }

  if (name === "uniques") {
    query = isV2 ? V2_UNIQUES_QUERY : V1_UNIQUES_QUERY;
  }

  if (name === "minimap") {
    query = `SELECT * FROM ${TableNames.MinimapIcons}`;
  }

  // Prefix all tables with patch version
  for (const table of TABLES) {
    query = query.replace(
      new RegExp(`(?<!\\.)\\b${table}\\b`, "g"),
      `"${patch}_${table}"`,
    );
  }

  return query;
}
