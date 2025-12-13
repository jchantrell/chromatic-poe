export const TABLES = [
  "BaseItemTypes",
  "ItemVisualIdentity",
  "ItemClasses",
  "ItemClassCategories",
  "CurrencyExchange",
  "CurrencyExchangeCategories",
  "SkillGems",
  "GemTags",
  "GemEffects",
  "ArmourTypes",
  "WeaponTypes",
  "CurrencyItems",
  "Words",
  "UniqueStashLayout",
  "UniqueStashTypes",
  "Tags",
  "Mods",
  "ModType",
  "Stats",
  "AttributeRequirements",
  "GoldModPrices",
];

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
  BaseItemTypes.Name as 'name',
  ItemClasses.Name as 'class',
  ItemClassCategories.Text as 'category',
  ItemVisualIdentity.DDSFile as 'art',
  exchange_major.Name as 'exchangeCategory',
  exchange_sub.Name as 'exchangeSubCategory',

  CurrencyExchange.GoldPurchaseFee as 'price',
  SkillGems.StrengthRequirementPercent as 'strReq',
  SkillGems.DexterityRequirementPercent as 'dexReq',
  SkillGems.IntelligenceRequirementPercent as 'intReq',

  (ArmourTypes.ArmourMin + ArmourTypes.ArmourMax) / 2 as 'armour',
  (ArmourTypes.EvasionMin + ArmourTypes.EvasionMax) / 2 as 'evasion',
  (ArmourTypes.EnergyShieldMin + ArmourTypes.EnergyShieldMax) / 2 as 'energyShield',
  (ArmourTypes.WardMin + ArmourTypes.WardMax) / 2 as 'ward',

  WeaponTypes.DamageMin as 'dmgMin',
  WeaponTypes.DamageMax as 'dmgMax',
  WeaponTypes.Speed as 'speed',

  BaseItemTypes.Height as 'height',
  BaseItemTypes.Width as 'width',

  ItemClasses.CanBeCorrupted as corruptable,
  (CASE
    WHEN CurrencyItems.StackSize IS NOT NULL
    AND CurrencyItems.StackSize > 1
    THEN 1
    ELSE 0
  END) as stackable,

  SkillGems.GemEffects as 'gemFx',
  BaseItemTypes.DropLevel as 'dropLevel'

  FROM BaseItemTypes

  LEFT JOIN ItemClasses
  ON BaseItemTypes.ItemClassesKey = ItemClasses._index

  LEFT JOIN ItemClassCategories
  ON ItemClasses.ItemClassCategory = ItemClassCategories._index

  LEFT JOIN ItemVisualIdentity
  ON BaseItemTypes.ItemVisualIdentity = ItemVisualIdentity._index

  LEFT JOIN CurrencyExchange
  ON BaseItemTypes._index = CurrencyExchange.Item

  LEFT JOIN CurrencyExchangeCategories as exchange_major
  ON CurrencyExchange.Category = exchange_major._index

  LEFT JOIN CurrencyExchangeCategories as exchange_sub
  ON CurrencyExchange.SubCategory = exchange_sub._index

  LEFT JOIN ArmourTypes
  ON BaseItemTypes._index = ArmourTypes.BaseItemTypesKey

  LEFT JOIN WeaponTypes
  ON BaseItemTypes._index = WeaponTypes.BaseItemTypesKey

  LEFT JOIN SkillGems
  ON BaseItemTypes._index = SkillGems.BaseItemTypesKey

  LEFT JOIN CurrencyItems
  ON BaseItemTypes._index = CurrencyItems.BaseItemTypesKey

  WHERE BaseItemTypes.Name != '' AND BaseItemTypes.Name IS NOT NULL
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
WHERE category IN ('Off-hand') 

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
WHERE category IN ('Jewellery') AND class != 'Trinkets'

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
WHERE category IN ('Flasks') 

UNION ALL

-- Idols
SELECT DISTINCT
name,
'Mapping' as category,
'Idols' AS class,
null AS type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Idols'

UNION ALL

-- Gems
SELECT DISTINCT
name,
'Gems' AS category,
(CASE
  WHEN name LIKE 'Awakened%'
  THEN 'Awakened'
  WHEN name LIKE 'Vaal%' AND category = 'Gems'
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

-- Pieces
SELECT DISTINCT
name,
'Pieces' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Pieces'

UNION ALL

-- Jewels
SELECT DISTINCT
name,
'Jewels' AS category,
class,
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
WHERE class IN ('Jewels', 'Abyss Jewels')

UNION ALL

-- Heist
SELECT DISTINCT
name,
'Heist' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE (class = 'Heist Items' OR class = 'Trinkets') AND name NOT LIKE '[UNUSED]%'

UNION ALL

-- Runes
SELECT DISTINCT
name,
'Currency' AS category,
'Runes' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Runecrafting'

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

-- Omens
SELECT DISTINCT
name,
'Ritual' AS category,
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
'Delve' AS category,
exchangeSubCategory as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Delve'

UNION ALL

-- Catalysts
SELECT DISTINCT
name,
'Ultimatum' AS category,
exchangeSubCategory as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Catalysts'

UNION ALL

-- Scarabs
SELECT DISTINCT
name,
'Mapping' as category,
'Scarabs' AS class,
exchangeSubCategory as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Scarabs'

UNION ALL

-- Tattoos
SELECT DISTINCT
name,
'Tattoos' AS category,
(CASE
  WHEN exchangeSubCategory LIKE 'Dexterity%'
  THEN 'Dexterity'
  WHEN exchangeSubCategory LIKE 'Intelligence%'
  THEN 'Intelligence'
  WHEN exchangeSubCategory LIKE 'Strength%'
  THEN 'Strength'
  ELSE 'Unknown'
END)as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Tattoos'

UNION ALL

-- Oils
SELECT DISTINCT
name,
'Blight' AS category,
'Oils' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE exchangeCategory = 'Oils'

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

-- Maps
SELECT DISTINCT
name,
'Mapping' AS category,
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

-- Currency, Essence, Runes
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
WHERE exchangeCategory IN ('Essences', 'Currency', 'Runes')

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
'Legion' AS category,
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
'Legion' AS category,
'Splinters' as class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Timeless Eternal Empire Splinter', 'Timeless Karui Splinter', 'Timeless Templar Splinter', 'Timeless Vaal Splinter', 'Timeless Maraketh Splinter')

UNION ALL

SELECT DISTINCT
name,
'Legion' AS category,
'Emblems' as class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE name IN ('Timeless Eternal Emblem', 'Timeless Karui Emblem', 'Timeless Templar Emblem', 'Timeless Vaal Emblem', 'Timeless Maraketh Emblem','Unrelenting Timeless Eternal Emblem', 'Unrelenting Timeless Karui Emblem', 'Unrelenting Timeless Templar Emblem', 'Unrelenting Timeless Vaal Emblem', 'Unrelenting Timeless Maraketh Emblem')

UNION ALL

-- Expedition
SELECT DISTINCT
name,
'Expedition' AS category,
'Logbooks' as class,
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
'Sanctum' AS category,
'Fragments' as class,
null as type,
price AS score, 
${extraFields}
FROM ITEMS
WHERE name = 'Forbidden Tome'

UNION ALL

SELECT DISTINCT
name,
'Sanctum' AS category,
class,
null as type,
0 AS score, 
${extraFields}
FROM ITEMS
WHERE class = 'Relics' AND name NOT LIKE '[DO NOT USE]%'

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
'Ritual' AS category,
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
  BaseItemTypes.Name as 'name',
  ItemClasses.Name as 'class',
  ItemClassCategories.Text as 'category',
  ItemVisualIdentity.DDSFile as 'art',
  exchange_major.Name as 'exchangeCategory',
  exchange_sub.Name as 'exchangeSubCategory',

  CurrencyExchange.GoldPurchaseFee as 'price',
  
  -- Use COALESCE for V2 requirement logic
  COALESCE(
    AttributeRequirements.ReqStr,
    SkillGems.StrengthRequirementPercent
  ) as 'strReq',
  COALESCE(
    AttributeRequirements.ReqDex,
    SkillGems.DexterityRequirementPercent
  ) as 'dexReq',
  COALESCE(
    AttributeRequirements.ReqInt,
    SkillGems.IntelligenceRequirementPercent
  ) as 'intReq',

  ArmourTypes.Armour as 'armour',
  ArmourTypes.Evasion as 'evasion',
  ArmourTypes.EnergyShield as 'energyShield',
  ArmourTypes.Ward as 'ward',

  WeaponTypes.DamageMin as 'dmgMin',
  WeaponTypes.DamageMax as 'dmgMax',
  WeaponTypes.Speed as 'speed',

  BaseItemTypes.Height as 'height',
  BaseItemTypes.Width as 'width',

  ItemClasses.CanBeCorrupted as corruptable,
  (CASE
    WHEN CurrencyItems.StackSize IS NOT NULL
    AND CurrencyItems.StackSize > 1
    THEN 1
    ELSE 0
  END) as stackable,

  SkillGems.GemEffects as 'gemFx',
  BaseItemTypes.DropLevel as 'dropLevel'

  FROM BaseItemTypes

  LEFT JOIN ItemClasses
  ON BaseItemTypes.ItemClass = ItemClasses._index

  LEFT JOIN ItemClassCategories
  ON ItemClasses.ItemClassCategory = ItemClassCategories._index

  LEFT JOIN ItemVisualIdentity
  ON BaseItemTypes.ItemVisualIdentity = ItemVisualIdentity._index

  LEFT JOIN CurrencyExchange
  ON BaseItemTypes._index = CurrencyExchange.Item

  LEFT JOIN CurrencyExchangeCategories as exchange_major
  ON CurrencyExchange.Category = exchange_major._index

  LEFT JOIN CurrencyExchangeCategories as exchange_sub
  ON CurrencyExchange.SubCategory = exchange_sub._index
  
  LEFT JOIN AttributeRequirements
  ON BaseItemTypes._index = AttributeRequirements.BaseItemType

  LEFT JOIN ArmourTypes
  ON BaseItemTypes._index = ArmourTypes.BaseItemType

  LEFT JOIN WeaponTypes
  ON BaseItemTypes._index = WeaponTypes.BaseItemType

  LEFT JOIN SkillGems
  ON BaseItemTypes._index = SkillGems.BaseItemType

  LEFT JOIN CurrencyItems
  ON BaseItemTypes._index = CurrencyItems.BaseItemType

  WHERE BaseItemTypes.Name != '' AND BaseItemTypes.Name IS NOT NULL
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

-- Currency, Essence, Runes
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
WHERE exchangeCategory IN ('Essences', 'Currency', 'Runes')

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

export function getQuery(patch: string, name: string): string {
  const isV2 = patch.startsWith("4.");

  let query = "";
  if (name === "items") {
    query = isV2 ? V2_ITEMS_QUERY : V1_ITEMS_QUERY;
  }

  if (name === "mods") {
    query = `SELECT * FROM Mods`;
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
