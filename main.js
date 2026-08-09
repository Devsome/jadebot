// ==UserScript==
// @name         Silkroad Online Bot Helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Combat and loot automation helper for Silkroad Online with GUI
// @author       Devsome
// @match        https://play.jadeway.online/
// @grant        GM_addStyle
// @grant        GM_log
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
(function() {
    'use strict';

    // This script runs sandboxed because of the GM_addStyle/GM_log grants.
    // `window` inside the sandbox is NOT the real page window, so anything
    // that needs to interact with the page (most importantly WebSocket) has
    // to go through `unsafeWindow`, which does point at the real page window
    // even in sandboxed mode.
    const uw = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // ============================================================
    //  1. STYLES
    // ============================================================
    GM_addStyle(`
        #sb-helper-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 460px;
            max-width: calc(100vw - 20px);
            max-height: 90vh;
            box-sizing: border-box;
            background: rgba(15, 15, 15, 0.92);
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #e6e6e6;
            font-family: 'Segoe UI', Consolas, monospace;
            font-size: 12px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0,0,0,0.7);
            padding: 10px;
            min-height: 100px;
            overflow-y: auto;
            overflow-x: hidden;
        }
        #sb-helper-panel::-webkit-scrollbar {
            width: 6px;
        }
        #sb-helper-panel::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        #sb-helper-panel::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
        }
        #sb-helper-panel * {
            box-sizing: border-box;
        }
        #sb-helper-panel .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
        }
        #sb-helper-panel .panel-title {
            font-weight: 600;
            color: #6fbf73;
            font-size: 13px;
            letter-spacing: 0.3px;
        }
        #sb-helper-panel .panel-close {
            cursor: pointer;
            color: #999;
            font-size: 16px;
            line-height: 1;
        }
        #sb-helper-panel .panel-close:hover {
            color: #ddd;
        }
        #sb-helper-panel .panel-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 8px;
        }
        #sb-helper-panel .panel-buttons button {
            background: #232323;
            border: 1px solid #444;
            color: #ddd;
            padding: 4px 9px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
            transition: background 0.15s, border-color 0.15s;
        }
        #sb-helper-panel .panel-buttons button:hover {
            background: #333;
            border-color: #666;
        }
        #sb-helper-panel .panel-buttons button.danger:hover {
            background: #4a2626;
            border-color: #a04b4b;
        }
        #sb-helper-panel .panel-buttons button.primary {
            background: #2c5c33;
            border-color: #3f8a49;
        }
        #sb-helper-panel .panel-buttons button.primary:hover {
            background: #35723d;
        }
        #sb-helper-panel .panel-buttons button.active {
            background: #7a3b3b;
            border-color: #b25353;
        }
        #sb-helper-panel .panel-input-row {
            display: flex;
            gap: 5px;
            margin-bottom: 8px;
            align-items: center;
        }
        #sb-helper-panel .panel-input-row input {
            flex: 1;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            color: #e6e6e6;
            padding: 4px 8px;
            border-radius: 3px;
            font-family: inherit;
            font-size: 11px;
        }
        #sb-helper-panel .panel-input-row input:focus {
            outline: none;
            border-color: #6fbf73;
        }
        #sb-helper-panel .panel-input-row label {
            color: #999;
            font-size: 11px;
            min-width: 40px;
        }
        #sb-helper-panel .panel-log {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #2a2a2a;
            border-radius: 3px;
            padding: 5px 8px;
            min-height: 70px;
            max-height: 140px;
            overflow-y: auto;
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-all;
        }
        #sb-helper-panel .panel-log::-webkit-scrollbar {
            width: 6px;
        }
        #sb-helper-panel .panel-log::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        #sb-helper-panel .panel-log::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
        }
        #sb-helper-panel .panel-status {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #2a2a2a;
            padding-top: 5px;
        }
        #sb-helper-panel .panel-status .status-ok {
            color: #6fbf73;
        }
        #sb-helper-panel .panel-status .status-error {
            color: #d97878;
        }
        #sb-helper-panel .panel-status-line {
            margin-top: 4px;
            font-size: 10px;
            color: #999;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        #sb-helper-panel .panel-status-line.status-ok {
            color: #6fbf73;
        }
        #sb-helper-panel .panel-status-line.status-error {
            color: #d97878;
        }
        .sb-log-entry {
            border-bottom: 1px solid rgba(255,255,255,0.04);
            padding: 1px 0;
        }
        .sb-log-entry .time {
            color: #666;
            margin-right: 6px;
        }
        .sb-log-entry .monster-id {
            color: #6fbf73;
        }
        .sb-log-entry .damage {
            color: #d97878;
        }
        .sb-log-entry .loot {
            color: #d9b95a;
        }
        .sb-log-entry .xp {
            color: #7fb8d9;
        }
        .sb-log-entry .error {
            color: #e05a5a;
        }
        .sb-log-entry .info {
            color: #8fa6c2;
        }
        /* ---- Monster Radar window ---- */
        #sb-monster-panel {
            position: fixed;
            top: 10px;
            left: 10px;
            width: 340px;
            max-height: 75vh;
            background: rgba(15, 15, 15, 0.92);
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #e6e6e6;
            font-family: 'Segoe UI', Consolas, monospace;
            font-size: 12px;
            z-index: 999996;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0,0,0,0.7);
            padding: 10px;
        }
        #sb-monster-panel .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
        }
        #sb-monster-panel .panel-title {
            font-weight: 600;
            color: #d97878;
            font-size: 13px;
        }
        #sb-monster-panel .panel-close {
            cursor: pointer;
            color: #999;
            font-size: 16px;
            line-height: 1;
        }
        #sb-monster-panel .panel-close:hover {
            color: #ddd;
        }
        #sb-monster-panel .monster-count {
            color: #d97878;
            font-size: 11px;
            margin-bottom: 6px;
        }
        #sb-monster-panel .monster-table-wrap {
            overflow-y: auto;
            max-height: 60vh;
        }
        #sb-monster-panel .monster-table-wrap::-webkit-scrollbar {
            width: 6px;
        }
        #sb-monster-panel .monster-table-wrap::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        #sb-monster-panel .monster-table-wrap::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
        }
        #sb-monster-panel table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        #sb-monster-panel th {
            text-align: left;
            color: #d97878;
            border-bottom: 1px solid #333;
            padding: 3px 4px;
            position: sticky;
            top: 0;
            background: rgba(15,15,15,0.95);
        }
        #sb-monster-panel td {
            padding: 3px 4px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: middle;
        }
        #sb-monster-panel tr.closest td {
            background: rgba(217,120,120,0.12);
        }
        #sb-monster-panel .monster-attack-btn {
            background: #2c5c33;
            border: 1px solid #3f8a49;
            color: #ddd;
            padding: 2px 7px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-family: inherit;
        }
        #sb-monster-panel .monster-attack-btn:hover {
            background: #35723d;
        }
        /* ---- Job tab (gatherable nodes: trees, ore, ...) ---- */
        #sb-helper-panel .job-count {
            color: #d9b95a;
            font-size: 11px;
            margin-bottom: 6px;
        }
        #sb-helper-panel .job-table-wrap {
            overflow-y: auto;
            max-height: 220px;
        }
        #sb-helper-panel .job-table-wrap table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        #sb-helper-panel .job-table-wrap th {
            text-align: left;
            color: #d9b95a;
            border-bottom: 1px solid #333;
            padding: 3px 4px;
            position: sticky;
            top: 0;
            background: rgba(15,15,15,0.95);
        }
        #sb-helper-panel .job-table-wrap td {
            padding: 3px 4px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            vertical-align: middle;
        }
        #sb-helper-panel .job-table-wrap tr.closest td {
            background: rgba(217,185,90,0.12);
        }
        #sb-helper-panel .job-gather-btn {
            background: #6b4d1f;
            border: 1px solid #a0813f;
            color: #ddd;
            padding: 2px 7px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-family: inherit;
        }
        #sb-helper-panel .job-gather-btn:hover {
            background: #7d5a26;
        }
        #sb-helper-panel .job-gather-btn:disabled {
            opacity: 0.5;
            cursor: default;
        }
        #sb-helper-panel .node-grade-blue { color: #7fb8d9; }
        #sb-helper-panel .node-grade-green { color: #6fbf73; }
        #sb-helper-panel .node-grade-red { color: #d97878; }
        #sb-show-panel-btn, #sb-show-monster-btn {
            position: fixed;
            bottom: 10px;
            background: #2c5c33;
            color: #eee;
            border: none;
            border-radius: 4px;
            padding: 7px 14px;
            font-size: 12px;
            cursor: pointer;
            z-index: 999998;
            font-family: 'Segoe UI', Arial, sans-serif;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: none;
        }
        #sb-show-panel-btn {
            right: 10px;
        }
        #sb-show-monster-btn {
            left: 10px;
            background: #6b3535;
        }
        #sb-show-panel-btn:hover {
            background: #35723d;
        }
        #sb-show-monster-btn:hover {
            background: #7d3e3e;
        }
        /* ---- Available Skills modal ---- */
        #sb-skills-modal, #sb-inventory-modal {
            position: fixed;
            inset: 0;
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #sb-skills-modal .sb-modal-backdrop, #sb-inventory-modal .sb-modal-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.6);
        }
        #sb-skills-modal .sb-modal-content, #sb-inventory-modal .sb-modal-content {
            position: relative;
            width: 420px;
            max-width: calc(100vw - 20px);
            max-height: 70vh;
            background: rgba(20,20,20,0.97);
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            font-family: 'Segoe UI', Consolas, monospace;
            color: #e6e6e6;
            font-size: 12px;
        }
        #sb-skills-modal .sb-modal-header, #sb-inventory-modal .sb-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            border-bottom: 1px solid #333;
        }
        #sb-skills-modal .sb-modal-title, #sb-inventory-modal .sb-modal-title {
            font-weight: 600;
            color: #6fbf73;
            font-size: 13px;
        }
        #sb-skills-modal .sb-modal-close, #sb-inventory-modal .sb-modal-close {
            cursor: pointer;
            color: #999;
            font-size: 18px;
            line-height: 1;
        }
        #sb-skills-modal .sb-modal-close:hover, #sb-inventory-modal .sb-modal-close:hover {
            color: #ddd;
        }
        #sb-skills-modal .sb-modal-body, #sb-inventory-modal .sb-modal-body {
            overflow-y: auto;
            padding: 4px 12px 10px;
        }
        #sb-inventory-modal .sb-modal-equip-summary {
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px solid #333;
        }
        #sb-skills-modal .sb-modal-empty, #sb-inventory-modal .sb-modal-empty {
            color: #999;
            padding: 12px 0;
        }
        #sb-skills-modal .sb-modal-skill-row, #sb-inventory-modal .sb-modal-skill-row {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
            padding: 7px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        #sb-skills-modal .sb-modal-skill-name, #sb-inventory-modal .sb-modal-skill-name {
            word-break: break-all;
        }
        #sb-skills-modal .sb-modal-skill-btn, #sb-inventory-modal .sb-modal-skill-btn {
            flex-shrink: 0;
            border: 1px solid #444;
            color: #ddd;
            padding: 3px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
            background: #232323;
        }
        #sb-skills-modal .sb-modal-skill-btn.add, #sb-inventory-modal .sb-modal-skill-btn.add {
            background: #2c5c33;
            border-color: #3f8a49;
        }
        #sb-skills-modal .sb-modal-skill-btn.add:hover, #sb-inventory-modal .sb-modal-skill-btn.add:hover {
            background: #35723d;
        }
        #sb-skills-modal .sb-modal-skill-btn.remove, #sb-inventory-modal .sb-modal-skill-btn.remove {
            background: #6b3535;
            border-color: #a04b4b;
        }
        #sb-skills-modal .sb-modal-skill-btn.remove:hover, #sb-inventory-modal .sb-modal-skill-btn.remove:hover {
            background: #7d3e3e;
        }
        #sb-skills-modal .sb-modal-skill-btns, #sb-inventory-modal .sb-modal-skill-btns {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 5px;
        }
        #sb-skills-modal .sb-modal-skill-btn.buff, #sb-inventory-modal .sb-modal-skill-btn.buff {
            background: #2c4d5c;
            border-color: #3f7a8a;
        }
        #sb-skills-modal .sb-modal-skill-btn.buff:hover, #sb-inventory-modal .sb-modal-skill-btn.buff:hover {
            background: #355e72;
        }
        /* ---- Party controls ---- */
        #sb-helper-panel .panel-section-title {
            color: #999;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin: 8px 0 4px;
            border-top: 1px solid #2a2a2a;
            padding-top: 6px;
        }
        #sb-helper-panel .panel-checkbox-row {
            display: flex;
            gap: 14px;
            align-items: center;
            margin-bottom: 8px;
            color: #ccc;
        }
        #sb-helper-panel .panel-checkbox-row label {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        }
        #sb-helper-panel .panel-checkbox-row input[type="checkbox"] {
            accent-color: #6fbf73;
        }
        #sb-helper-panel .panel-party-apps {
            margin-bottom: 4px;
            max-height: 140px;
            overflow-y: auto;
        }
        #sb-helper-panel .panel-party-app-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 6px;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 11px;
        }
        #sb-helper-panel .panel-party-app-name {
            color: #ddd;
        }
        #sb-helper-panel .panel-party-app-btns {
            display: flex;
            gap: 4px;
            flex-shrink: 0;
        }
        #sb-helper-panel .panel-party-app-btns button {
            border: 1px solid #444;
            color: #ddd;
            padding: 2px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-family: inherit;
            background: #232323;
        }
        #sb-helper-panel .panel-party-app-btns button.accept {
            background: #2c5c33;
            border-color: #3f8a49;
        }
        #sb-helper-panel .panel-party-app-btns button.accept:hover {
            background: #35723d;
        }
        #sb-helper-panel .panel-party-app-btns button.reject {
            background: #6b3535;
            border-color: #a04b4b;
        }
        #sb-helper-panel .panel-party-app-btns button.reject:hover {
            background: #7d3e3e;
        }
        #sb-helper-panel .panel-party-apps-empty {
            color: #666;
            font-size: 10px;
            padding: 2px 0 4px;
        }
        /* ---- Tabs ---- */
        #sb-helper-panel .panel-tabs {
            display: flex;
            gap: 2px;
            margin-bottom: 8px;
            border-bottom: 1px solid #333;
        }
        #sb-helper-panel .panel-tab-btn {
            flex: 1;
            background: transparent;
            border: none;
            color: #999;
            padding: 6px 4px;
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
            border-bottom: 2px solid transparent;
            transition: color 0.15s, border-color 0.15s;
        }
        #sb-helper-panel .panel-tab-btn:hover {
            color: #ccc;
        }
        #sb-helper-panel .panel-tab-btn.active {
            color: #6fbf73;
            border-bottom-color: #6fbf73;
        }
        #sb-helper-panel .panel-tab-content {
            display: none;
        }
        #sb-helper-panel .panel-tab-content.active {
            display: block;
        }
        /* ---- Active skills/buffs lists (Skills tab) ---- */
        #sb-helper-panel .panel-skill-list {
            margin-bottom: 6px;
            max-height: 140px;
            overflow-y: auto;
        }
        #sb-helper-panel .panel-list-empty {
            color: #666;
            font-size: 10px;
            padding: 2px 0 8px;
        }
        #sb-helper-panel .panel-skill-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 6px;
            padding: 4px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 11px;
        }
        #sb-helper-panel .panel-skill-name {
            color: #ddd;
            word-break: break-all;
        }
        #sb-helper-panel .panel-skill-timer {
            color: #7fb8d9;
        }
        #sb-helper-panel .panel-skill-remove-btn {
            flex-shrink: 0;
            border: 1px solid #a04b4b;
            background: #6b3535;
            color: #ddd;
            padding: 2px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-family: inherit;
        }
        #sb-helper-panel .panel-skill-remove-btn:hover {
            background: #7d3e3e;
        }
    `);
    // ============================================================
    //  2. GLOBAL STATE
    // ============================================================
    const HIDDEN_TYPES = new Set(['ping', 'pong']);
    window.__lastTargetId = null;
    window.__maxHp = null;
    window.__maxMp = null;
    window.__playerId = null;
    window.__entityCache = {};
    window.__staleEntityMs = 20000; // how long a monster can go without an update before it's pruned
    window.__playerPos = { x: 0, z: 0 };
    window.__activeSkills = [];
    window.__knownSkills = [];   // all skills reported by the game (zone.init)
    // Self-buffs the bot keeps active. Separate from __activeSkills (combat
    // rotation) - these get cast without a target and re-cast automatically
    // before they expire, based on buffs.update.
    window.__activeBuffs = [];      // { base, level, fullName }
    // buffs.update reports groupId + expiresAt for both skill buffs and
    // item/consumable buffs alike, so both share this same expiry
    // bookkeeping (keyed by base for skills, itemId for items).
    window.__buffExpiry = {};       // groupId -> expiresAt (ms epoch), from buffs.update
    window.__buffLeadMs = 3000;     // recast this many ms before actual expiry
    // Cooldown tracking, separate from buff duration - a buff can run out
    // faster than its skill/item is off cooldown again (recast attempted
    // too early otherwise -> ERR_COOLDOWN, retried every tick, spammy).
    // cast.ok gives us the exact answer: { groupId, readyAt } where readyAt
    // is the absolute epoch ms the skill is castable again - e.g. observed
    // wizard_eartha_guard_a with readyAt exactly 60000ms after skill.fire's
    // "at", i.e. a flat 60s cooldown. That's authoritative, so it's the
    // primary mechanism; the backoff below is only a fallback for before
    // we've seen a cast.ok for a given groupId, or on an ERR_COOLDOWN.
    window.__buffReadyAt = {};      // groupId -> ms epoch when castable again, from cast.ok (or learned from ERR_COOLDOWN as a fallback)
    window.__buffLastCastAt = {};   // groupId -> ms epoch of the last cast attempt sent
    window.__buffBackoffMs = {};    // groupId -> fallback retry spacing, used only until a real readyAt is known
    window.__buffBackoffBaseMs = 8000;
    window.__buffBackoffMaxMs = 120000;
    // Inventory snapshot, from zone.init (self.inventory) and inv.update
    // (which appears to always send the full current state).
    window.__inventory = { gold: 0, bag: [], equip: {} };
    // Item buffs (consumables the bot keeps auto-using), tracked separately
    // from skill buffs since they don't have a "base"/tier - just an itemId.
    window.__activeItemBuffs = []; // { itemId }
    window.__invUseSeq = 0; // best-effort local counter for inv.use's top-level "q" field (unconfirmed meaning - see castItemBuff)
    window.__itemBuffMissingLoggedAt = {}; // itemId -> ts, throttles "not in inventory" warnings
    window.__itemBuffMissingWarnMs = 30000;
    window.__skillIndex = 0;
    window.__currentTarget = null;
    window.__isFighting = false;
    // Job/gathering state (trees, ore, ... - see "Job" tab)
    window.__professions = [];        // from profession.update: [{ id, level, xp, xpToNext }]
    window.__currentGatherNodeId = null;
    window.__isGathering = false;
    window.__pickupQueue = [];
    window.__isPickingUp = false;
    window.__pickupTimer = null;
    window.__currentPickupId = null; // item we're currently waiting on confirmation for
    window.__pickupRetries = {};     // itemId -> retry count
    window.__pickupTimeoutMs = 4000; // time to wait for confirmation before retry/skip
    window.__pickupMaxRetries = 2;
    window.__logEntries = [];
    window.__isInitialized = false;
    // Per-character skill persistence
    window.__charId = null;                 // stable character identity (self.charId from zone.init)
    window.__skillsRestoredForCharId = null; // guards against re-restoring on every zone.init in the same session
    // Party matching applications waiting for accept/reject
    window.__partyApplications = []; // { charId, name, level, race, expiresAt }
    // Current party, from the last party.update packet; null if not in one.
    // While this is set, the server won't let you create/adjust a party -
    // you have to party.leave first.
    window.__currentParty = null; // { partyId, leaderCharId, expShare, itemShare, ... }
    // Party auto-management
    window.__autoAcceptApplications = false;
    window.__autoReformParty = false;
    // When on, Auto-accept accepts every applicant regardless of the
    // whitelist below (whitelist is then effectively ignored). When off
    // (default), only whitelisted names get auto-accepted - and an empty
    // whitelist means nobody does, same as before this was added.
    window.__autoAcceptAnyone = false;
    // The server hasn't told us the real party size limit anywhere we've
    // seen yet - going with the confirmed default ("both expShare/itemShare
    // false -> 4-person party"). Adjust in the console if your combo gives
    // a different size: window.__partyMaxSize = N
    window.__partyMaxSize = 4;
    window.__partyMatchRegistered = false; // our best guess at whether party.match register is currently active
    window.__lastPartyMatchTitle = null;   // reused by auto-reform so it doesn't need to prompt for a title again
    window.__lastPartyMatchOpts = null;    // { raceReq, minLevel, maxLevel } from the last manual register
    // Best-effort member count, used only if party.update doesn't expose a
    // recognizable member list (see getPartyMemberCount below). Can't detect
    // members leaving on its own - only accepted applications increment it.
    window.__partyMemberCountFallback = 0;
    // Only names on this list get auto-accepted when Auto-accept is on;
    // everyone else still lands in the pending Applications list for manual
    // review. Global (not per-character) since it's really "people I know",
    // not tied to a specific character.
    window.__partyAutoAcceptWhitelist = [];
    // ---- Weapon Settings (see that tab) ----
    // Some support skills need a different weapon (sometimes shield too)
    // equipped before they can be cast, e.g. a cleric who normally fights
    // with a wizard staff has to swap to a "buff weapon" first, then back.
    // Both the normal fighting gear and the buff gear are explicitly
    // declared (picked from the Inventory modal) rather than guessed from
    // whatever happens to be equipped at the time - that way "switch back"
    // always has a well-defined target, set per-character.
    window.__primaryWeaponItemId = null;
    window.__primaryShieldItemId = null;
    window.__buffWeaponItemId = null;
    window.__buffShieldItemId = null;
    // True while buff gear is currently equipped instead of primaryWeapon/
    // primaryShield - drives switching back (to the declared primary, not
    // something remembered dynamically) once nobody needs a (re)buff
    // anymore. Shared between self-buffs and party-buffs since it's the
    // same physical weapon slot either way.
    // Only flips true/false once CONFIRMED via inv.update actually reporting
    // the expected weapon (see __weaponSwapPending) - not the moment the
    // inv.move is sent. Buff/party-buff casts that need the swap are gated
    // on this, so a cast never fires against gear that only *looks* like it
    // should have swapped by now.
    window.__weaponSwappedToBuffGear = false;
    // Tracks an in-flight equip swap between sending inv.move and getting
    // it confirmed by inv.update: { direction: 'toBuff'|'toPrimary',
    // expectedWeaponId, expectedShieldId, sentAt, attempts }. Attacking is
    // held off for as long as this is non-null (see maintainBuffs) -
    // attacking mid-swap appears to race with the pending inv.move
    // server-side and silently drops it, which is why the weapon sometimes
    // never actually changed even though "Switched to buff gear." got
    // logged. If no confirmation arrives within
    // __weaponSwapPendingTimeoutMs, the swap is retried (bag slot may have
    // shifted, packet may have been dropped, ...) up to
    // __weaponSwapMaxAttempts times before giving up and forcing the state
    // so the bot doesn't stall forever.
    window.__weaponSwapPending = null;
    window.__weaponSwapPendingTimeoutMs = 5000;
    window.__weaponSwapMaxAttempts = 3;
    // Configured party buffs (buffs cast on OTHER party members, never on
    // yourself - self-buffs live in __activeBuffs instead, see addBuff).
    // { base, level, fullName, needsWeaponSwap }. needsWeaponSwap is set
    // per entry (not guessed from the skill name) since whether a class
    // needs the swap at all varies - see addPartyBuff.
    //
    // Careful with needsWeaponSwap on skills that also exist as a
    // self-buff: a captured packet trace showed a support buff applied to
    // an ally survives the caster swapping back to their primary weapon
    // just fine, but the *same* buff applied to yourself gets cancelled
    // immediately by that same weapon swap (buffs.update went empty right
    // after the swap-back). That's a game mechanic (some buffs are tied to
    // the caster's own weapon stance), not something this bot can work
    // around - only mark a *self* buff (Skills tab) as needing the swap if
    // you've confirmed it actually survives switching back.
    window.__partyBuffs = [];
    // Vitals (HP/MP) - fixed display, updated in place instead of logged
    window.__hp = null;
    window.__mp = null;
    // Packet debug (IN/OUT to console) - off by default
    window.__debugWS = false;
    // Ring buffer of every IN/OUT packet seen while debug is ON, so the log
    // can be exported/copied later instead of having to copy packets out of
    // the console by hand.
    window.__packetLog = [];
    window.__packetLogMax = 1500;
    // Bot loop (auto attack + loot)
    window.__botLoopActive = false;
    window.__botLoopTimer = null;
    window.__botLoopIntervalMs = 1200;
    // ---- Leveling radius ("stay near where I pressed Start Bot") ----
    // Captured fresh from window.__playerPos every time startBot() runs, so
    // "the center" is always wherever the bot was started, not some fixed
    // map coordinate. __botRadius <= 0 means unlimited (legacy behavior -
    // attack whatever's closest, anywhere).
    window.__botCenter = null;      // { x, z } snapshot taken at Start Bot
    window.__botRadius = 0;         // game units; 0/negative = no limit
    // ---- Stuck / obstacle detection ----
    // A monster behind a wall or other obstacle can be "in range" and
    // targetable but never actually take damage (skill.cast/combat.attack
    // just silently fails to land). We detect that by watching for our own
    // damage on combat.event - if none arrives for __stuckThresholdMs after
    // engaging (or since the last hit that did land), we treat the target
    // as unreachable and either walk around it or fall back to the
    // configured "return to center" behavior instead of hammering the same
    // attack packet forever.
    window.__lastOwnDamageAt = null;   // Date.now() of the last combat.event where src === self
    window.__combatEngageAt = null;    // Date.now() when the current target was first engaged
    window.__stuckThresholdMs = 8000;  // "hasn't attacked in a while" cutoff
    window.__stuckState = 'idle';      // 'idle' | 'probing' | 'returning'
    window.__stuckProbeSequence = ['back', 'left', 'right'];
    window.__stuckProbeStep = 0;
    window.__stuckProbeStepStartedAt = null;
    window.__stuckProbeStepMs = 3500;      // time to walk each leg before testing an attack
    window.__stuckReturnStartedAt = null;
    window.__stuckReturnTimeoutMs = 10000; // time to let the walk back to center play out
    window.__returnToCenterOnStuck = false; // checkbox: give up on obstacle-dodging, go recenter instead
    // Monsters we just gave up on (still behind an obstacle) are ignored as
    // attack targets for a cooldown instead of being immediately re-picked
    // as "closest" again next tick.
    window.__blockedUntil = {};        // monsterId -> Date.now() epoch until which to skip it
    window.__blockedRetryMs = 45000;
    // WebSocket tracking
    window.__ws = null;           // "primary" / most recently opened socket
    window.__wsList = [];         // all detected sockets: {ws, url, openedAt, closedAt}
    // ============================================================
    //  3. LOGGING (GUI + console)
    // ============================================================
    function addLog(message, className = 'info') {
        const time = new Date().toLocaleTimeString();
        const entry = { time, message, className };
        window.__logEntries.push(entry);
        if (window.__logEntries.length > 500) {
            window.__logEntries.shift();
        }
        updateLogDisplay();
        console.log(`[${time}] ${message}`);
    }
    function updateLogDisplay() {
        const logElement = document.getElementById('sb-log-content');
        if (!logElement) return;
        const html = window.__logEntries.map(entry =>
            `<div class="sb-log-entry"><span class="time">[${entry.time}]</span><span class="${entry.className}">${entry.message}</span></div>`
        ).join('');
        logElement.innerHTML = html;
        logElement.scrollTop = logElement.scrollHeight;
    }
    // ============================================================
    //  4. FILTER
    // ============================================================
    function shouldHide(msg) {
        if (HIDDEN_TYPES.has(msg.t)) return true;
        if (msg.t === 'batch' && Array.isArray(msg.d)) {
            msg.d = msg.d.filter(ev => !HIDDEN_TYPES.has(ev.t));
            if (msg.d.length === 0) return true;
        }
        return false;
    }
    // ============================================================
    //  5. SKILL MANAGEMENT
    // ============================================================
    function extractSkillParts(fullName) {
        const parts = fullName.split('_');
        const last = parts[parts.length - 1];
        if (/^\d+$/.test(last)) {
            const level = parseInt(last, 10);
            const base = parts.slice(0, -1).join('_');
            return { base, level };
        }
        return { base: fullName, level: 0 };
    }
    // Human-readable skill names. Rather than a hand-maintained table (which
    // drifts out of sync with the game's actual skill list), this reads the
    // game client's own locale cache straight out of localStorage - the same
    // "mmo.locale.pack.v1" entry the game itself uses for German UI text -
    // and pulls every "skill:<base>.name" string out of it. Lazily loaded on
    // first use so it runs after the game has actually written the pack.
    let SKILL_NAMES = null;
    function loadSkillNames() {
        const names = {};
        try {
            const store = uw.localStorage || localStorage;
            const raw = store.getItem('mmo.locale.pack.v1');
            if (!raw) {
                addLog('No locale pack found in localStorage yet (mmo.locale.pack.v1) - skill names will show as raw ids until it loads.', 'error');
                return names;
            }
            const pack = JSON.parse(raw);
            const dict = (pack && pack.dict) || {};
            const prefix = 'skill:';
            const suffix = '.name';
            for (const key in dict) {
                if (key.startsWith(prefix) && key.endsWith(suffix)) {
                    const base = key.slice(prefix.length, -suffix.length);
                    names[base] = dict[key];
                }
            }
            addLog(`Loaded ${Object.keys(names).length} skill name(s) from locale pack (${pack.lang || '?'}).`, 'info');
        } catch (e) {
            addLog(`Could not read skill names from locale pack: ${e.message}`, 'error');
        }
        return names;
    }
    // Call this from the console (reloadSkillNames()) if you log in / switch
    // language after the bot has already loaded and the pack changed.
    window.reloadSkillNames = function() {
        SKILL_NAMES = loadSkillNames();
        if (document.getElementById('sb-skills-modal')) renderSkillsModalBody();
        updateActiveSkillsPanel();
        updateBuffStatusPanel();
        updatePartyBuffsPanel();
    };
    // Readable label for a fullName ("<base>_<level>", e.g. "bow_area_a_3"):
    // looks up the base id in SKILL_NAMES (loading it on first call) and
    // appends the level. Falls back to the raw base id if the skill isn't in
    // the pack yet.
    function skillLabel(fullName) {
        if (!SKILL_NAMES) SKILL_NAMES = loadSkillNames();
        const { base, level } = extractSkillParts(fullName);
        const name = SKILL_NAMES[base] || base;
        return level > 0 ? `${name} (Stufe ${level})` : name;
    }
    function addSkill(fullName) {
        const { base, level } = extractSkillParts(fullName);
        if (level === 0) {
            addLog(`Skill "${fullName}" has no level suffix - ignored.`, 'error');
            return;
        }
        const exists = window.__activeSkills.some(s => s.base === base);
        if (exists) {
            addLog(`Skill "${base}" is already active.`, 'info');
            return;
        }
        window.__activeSkills.push({ base, level, fullName });
        window.__activeSkills.sort((a, b) => a.base.localeCompare(b.base));
        addLog(`Skill added: ${fullName} (base: ${base}, level ${level})`, 'info');
        saveActiveSkillsForChar();
        updateStatus();
    }
    function removeSkill(fullName) {
        const idx = window.__activeSkills.findIndex(s => s.fullName === fullName);
        if (idx !== -1) {
            const removed = window.__activeSkills.splice(idx, 1)[0];
            addLog(`Skill removed: ${removed.fullName}`, 'error');
            saveActiveSkillsForChar();
        } else {
            addLog(`Skill "${fullName}" is not active.`, 'info');
        }
        updateStatus();
    }
    // ---- Per-character skill persistence (localStorage) ----
    // Keyed by self.charId (stable across sessions/logins), not entityId
    // (which is per-spawn). Stores just the list of full skill names the
    // player had active; restored automatically the first time each
    // character shows up in a session (see zone.init handling below).
    const SKILLS_STORAGE_KEY = 'sb_active_skills_by_char';
    function loadSkillsConfig() {
        try {
            return JSON.parse(localStorage.getItem(SKILLS_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function saveActiveSkillsForChar() {
        if (!window.__charId) return;
        const cfg = loadSkillsConfig();
        cfg[window.__charId] = window.__activeSkills.map(s => s.fullName);
        try {
            localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {
            addLog('Could not save skill config to localStorage.', 'error');
        }
    }
    function restoreActiveSkillsForChar() {
        if (!window.__charId) return;
        const cfg = loadSkillsConfig();
        const saved = cfg[window.__charId];
        if (!Array.isArray(saved) || saved.length === 0) return;
        window.__activeSkills = [];
        for (const fullName of saved) {
            if (!window.__knownSkills.includes(fullName)) continue;
            const { base, level } = extractSkillParts(fullName);
            if (level === 0 || window.__activeSkills.some(s => s.base === base)) continue;
            window.__activeSkills.push({ base, level, fullName });
        }
        window.__activeSkills.sort((a, b) => a.base.localeCompare(b.base));
        if (window.__activeSkills.length > 0) {
            addLog(`Restored ${window.__activeSkills.length} saved skill(s) for this character.`, 'info');
            updateStatus();
        }
    }
    function showSkills() {
        if (window.__activeSkills.length === 0) {
            addLog('No active skills. Add one with addSkill("name").', 'info');
        } else {
            addLog(`Active skills (${window.__activeSkills.length}):`, 'info');
            window.__activeSkills.forEach(s => addLog(`  ${s.fullName} (${s.base}, level ${s.level})`, 'info'));
        }
    }
    // ---- Buffs (self-cast, auto-refreshed) ----
    // Confirmed packet format:
    //   OUT { t: "skill.cast", d: { groupId: base }, q: 1 }   (no targetId - self buff)
    //   IN  { t: "buffs.update", d: { id, buffs: [{ groupId, category, expiresAt }] } }
    function addBuff(fullName, needsWeaponSwap) {
        const { base, level } = extractSkillParts(fullName);
        if (level === 0) {
            addLog(`Buff "${fullName}" has no level suffix - ignored.`, 'error');
            return;
        }
        if (window.__activeBuffs.some(b => b.base === base)) {
            addLog(`Buff "${base}" is already active.`, 'info');
            return;
        }
        window.__activeBuffs.push({ base, level, fullName, needsWeaponSwap: !!needsWeaponSwap });
        window.__activeBuffs.sort((a, b) => a.base.localeCompare(b.base));
        addLog(`Buff added: ${fullName} (base: ${base}, level ${level})`, 'info');
        saveActiveBuffsForChar();
        updateBuffStatusPanel();
    }
    window.setBuffNeedsSwap = function(fullName, needsSwap) {
        const entry = window.__activeBuffs.find(b => b.fullName === fullName);
        if (!entry) return;
        entry.needsWeaponSwap = !!needsSwap;
        saveActiveBuffsForChar();
        addLog(`Buff "${fullName}" weapon swap: ${entry.needsWeaponSwap ? 'ON' : 'OFF'}`, 'info');
    };
    function removeBuff(fullName) {
        const idx = window.__activeBuffs.findIndex(b => b.fullName === fullName);
        if (idx !== -1) {
            const removed = window.__activeBuffs.splice(idx, 1)[0];
            delete window.__buffExpiry[removed.base];
            delete window.__buffLastCastAt[removed.base];
            delete window.__buffReadyAt[removed.base];
            delete window.__buffBackoffMs[removed.base];
            addLog(`Buff removed: ${removed.fullName}`, 'error');
            saveActiveBuffsForChar();
        } else {
            addLog(`Buff "${fullName}" is not active.`, 'info');
        }
        updateBuffStatusPanel();
    }
    function showBuffs() {
        if (window.__activeBuffs.length === 0) {
            addLog('No active buffs. Add one with addBuff("name").', 'info');
            return;
        }
        addLog(`Active buffs (${window.__activeBuffs.length}):`, 'info');
        window.__activeBuffs.forEach(b => {
            const exp = window.__buffExpiry[b.base];
            const remain = exp ? Math.max(0, Math.round((exp - Date.now()) / 1000)) : null;
            addLog(`  ${b.fullName} (${remain !== null ? remain + 's remaining' : 'not active yet'})`, 'info');
        });
    }
    // Casts a buff (self-target, no targetId) and marks it pending so
    // maintainBuffs() doesn't re-request it every tick while waiting for
    // the buffs.update confirmation.
    function castBuff(base) {
        window.__sendWS({ t: "skill.cast", d: { groupId: base }, q: 1 });
        window.__buffLastCastAt[base] = Date.now();
    }
    // True once enough time has passed since the last cast attempt for this
    // groupId - either a learned real cooldown (from an ERR_COOLDOWN with a
    // remaining-time hint) or, until we know that, a growing backoff so we
    // don't hammer the server (and spam the log) every tick while the skill
    // is still on cooldown.
    function canAttemptBuffCast(groupId) {
        const readyAt = window.__buffReadyAt[groupId];
        if (readyAt) return Date.now() >= readyAt;
        // No cast.ok seen yet for this groupId - fall back to a short,
        // growing backoff after each attempt instead of retrying every tick.
        const lastCast = window.__buffLastCastAt[groupId];
        if (!lastCast) return true;
        const backoff = window.__buffBackoffMs[groupId] || window.__buffBackoffBaseMs;
        return (Date.now() - lastCast) >= backoff;
    }
    function bumpBuffBackoff(groupId) {
        const current = window.__buffBackoffMs[groupId] || window.__buffBackoffBaseMs;
        window.__buffBackoffMs[groupId] = Math.min(window.__buffBackoffMaxMs, Math.round(current * 1.7));
        return window.__buffBackoffMs[groupId];
    }
    function selfBuffNeedsCast(buff) {
        const expiresAt = window.__buffExpiry[buff.base];
        return !expiresAt || (expiresAt - Date.now()) <= window.__buffLeadMs;
    }
    // ---- Weapon swapping shared by self-buffs and party-buffs ----
    // Equip slot indices for inv.move: weapon = 0 is confirmed via a
    // captured swap packet ({t:"inv.move", d:{from:{c:"bag",i:N},
    // to:{c:"equip",i:0}}} swapping the weapon). shield = 1 is inferred
    // from the equip object's key order (weapon, shield, head, ...) in
    // inv.update/zone.init but NOT yet confirmed via a captured shield-swap
    // packet - if shield swapping misbehaves, capture one (Debug tab ->
    // Copy Packet Log) and correct this.
    function equipSlotIndexFor(kind) {
        return kind === 'shield' ? 1 : 0;
    }
    // Swaps whatever currently has `itemId` in the bag into the given
    // equip slot (and vice versa, since inv.move just exchanges the two
    // slots' contents) - used for both switching TO buff gear and back TO
    // primary gear.
    function swapEquip(itemId, kind) {
        const slot = findBagSlotForItem(itemId);
        if (slot === null) {
            addLog(`${kind === 'shield' ? 'Shield' : 'Weapon'} "${itemId}" not found in bag - can't swap.`, 'error');
            return false;
        }
        window.__sendWS({ t: "inv.move", d: { from: { c: "bag", i: slot }, to: { c: "equip", i: equipSlotIndexFor(kind) } } });
        return true;
    }
    // Kicks off (or re-sends, on retry) a swap toward either buff gear or
    // primary gear and arms window.__weaponSwapPending so the caller can
    // wait for inv.update to actually confirm it landed instead of just
    // hoping the inv.move went through. Returns false without sending
    // anything if the target gear is already equipped (nothing to do) or
    // a swap is already in flight.
    function requestGearSwap(direction) {
        if (window.__weaponSwapPending) return false; // one in flight already - let it resolve/retry first
        const toBuff = direction === 'toBuff';
        const targetWeaponId = toBuff ? window.__buffWeaponItemId : window.__primaryWeaponItemId;
        const targetShieldId = toBuff ? window.__buffShieldItemId : window.__primaryShieldItemId;
        if (toBuff && !window.__buffWeaponItemId) {
            addLog('No buff weapon configured (Weapon Settings tab) - skipping weapon-swap buff(s).', 'error');
            return false;
        }
        if (!window.__primaryWeaponItemId) {
            addLog('No primary weapon configured (Weapon Settings tab) - set one before using weapon-swap buffs.', 'error');
            return false;
        }
        const equip = window.__inventory.equip || {};
        const currentWeaponId = equip.weapon ? equip.weapon.itemId : null;
        const currentShieldId = equip.shield ? equip.shield.itemId : null;
        const weaponAlreadyCorrect = !targetWeaponId || currentWeaponId === targetWeaponId;
        const shieldAlreadyCorrect = !targetShieldId || currentShieldId === targetShieldId;
        if (weaponAlreadyCorrect && shieldAlreadyCorrect) {
            // Already wearing the right gear - nothing to send, just make
            // sure the flag agrees.
            window.__weaponSwappedToBuffGear = toBuff;
            updateWeaponSettingsPanel();
            return false;
        }
        let sentAny = false;
        if (!weaponAlreadyCorrect) {
            if (swapEquip(targetWeaponId, 'weapon')) sentAny = true;
        }
        if (!shieldAlreadyCorrect) {
            if (swapEquip(targetShieldId, 'shield')) sentAny = true;
        }
        if (!sentAny) return false; // both swapEquip calls failed (item missing from bag)
        window.__weaponSwapPending = {
            direction,
            expectedWeaponId: targetWeaponId,
            expectedShieldId: targetShieldId || null,
            sentAt: Date.now(),
            attempts: 1
        };
        addLog(`Switching to ${toBuff ? 'buff' : 'primary'} gear...`, 'info');
        return true;
    }
    function beginBuffWeaponSwap() {
        return requestGearSwap('toBuff');
    }
    // Always swaps back to the *declared* primary weapon/shield (Weapon
    // Settings tab), not whatever happened to be equipped before the swap -
    // predictable and doesn't depend on remembering state across ticks.
    function restorePrimaryGear() {
        requestGearSwap('toPrimary');
    }
    // Compares the current inventory snapshot against what
    // window.__weaponSwapPending expects. Called both right after inv.update
    // (fast path - confirms as soon as the server tells us) and every bot
    // tick (slow path - catches the timeout/retry case below).
    function resolvePendingWeaponSwapIfMatched() {
        const pending = window.__weaponSwapPending;
        if (!pending) return false;
        const equip = window.__inventory.equip || {};
        const currentWeaponId = equip.weapon ? equip.weapon.itemId : null;
        const currentShieldId = equip.shield ? equip.shield.itemId : null;
        const weaponOk = currentWeaponId === pending.expectedWeaponId;
        const shieldOk = !pending.expectedShieldId || currentShieldId === pending.expectedShieldId;
        if (!weaponOk || !shieldOk) return false;
        window.__weaponSwapPending = null;
        window.__weaponSwappedToBuffGear = (pending.direction === 'toBuff');
        updateWeaponSettingsPanel();
        addLog(`${pending.direction === 'toBuff' ? 'Buff' : 'Primary'} gear confirmed equipped.`, 'info');
        return true;
    }
    // Called every bot tick. If a swap has been pending too long without an
    // inv.update confirming it, the bag slot may have shifted or the
    // inv.move may simply have been dropped - retry a couple of times, then
    // give up and force the state so a missed confirmation can't stall the
    // bot (and attacking) forever.
    function checkPendingWeaponSwap() {
        const pending = window.__weaponSwapPending;
        if (!pending) return;
        if (resolvePendingWeaponSwapIfMatched()) return;
        if (Date.now() - pending.sentAt < window.__weaponSwapPendingTimeoutMs) return; // still waiting
        const toBuff = pending.direction === 'toBuff';
        if (pending.attempts >= window.__weaponSwapMaxAttempts) {
            addLog(`Gear swap to ${toBuff ? 'buff' : 'primary'} gear was never confirmed after ${pending.attempts} attempt(s) - forcing the state so the bot doesn't stall.`, 'error');
            window.__weaponSwapPending = null;
            window.__weaponSwappedToBuffGear = toBuff;
            updateWeaponSettingsPanel();
            return;
        }
        addLog(`Gear swap to ${toBuff ? 'buff' : 'primary'} gear not confirmed yet - retrying (attempt ${pending.attempts + 1}/${window.__weaponSwapMaxAttempts}).`, 'error');
        const nextAttempts = pending.attempts + 1;
        window.__weaponSwapPending = null; // clear so requestGearSwap is willing to send again
        requestGearSwap(pending.direction);
        if (window.__weaponSwapPending) window.__weaponSwapPending.attempts = nextAttempts;
    }
    // ---- Party buffing (buffs cast on OTHER party members, never self) ----
    // party.update turns out to carry a full member list (confirmed via
    // capture), including each member's current entityId, zoneId, and their
    // own buffs[] with expiresAt - so unlike self-buffs (which need
    // buffs.update to know what's active), party members' buff status can
    // just be read straight off window.__currentParty each time.
    //
    // Party members currently worth trying to buff: everyone but self, with
    // a known entityId, in the same zone as the player (buffing someone in
    // a different province isn't possible - they're simply not a valid
    // target). The player's own zoneId is read off their own entry in the
    // same member list rather than tracked separately.
    function getPartyBuffTargets() {
        const p = window.__currentParty;
        if (!p || !Array.isArray(p.members)) return [];
        const selfMember = p.members.find(m => m.charId === window.__charId);
        const myZone = selfMember ? selfMember.zoneId : null;
        return p.members.filter(m => m.charId !== window.__charId && m.entityId && (!myZone || m.zoneId === myZone));
    }
    function memberHasFreshBuff(member, base, leadMs) {
        const buffs = Array.isArray(member.buffs) ? member.buffs : [];
        const b = buffs.find(x => x.groupId === base);
        if (!b || typeof b.expiresAt !== 'number') return false;
        return (b.expiresAt - Date.now()) > leadMs;
    }
    function castPartyBuff(entry, member) {
        window.__sendWS({ t: "skill.cast", d: { groupId: entry.base, targetId: member.entityId } });
        window.__buffLastCastAt[entry.base] = Date.now();
        addLog(`Party buff: casting ${entry.fullName} on ${member.name}.`, 'info');
    }
    // Called from the bot loop tick. Maintains self-buffs, item buffs, and
    // party-buffs together since self- and party-buffs can share the same
    // weapon-swap gear:
    //  - Item buffs never involve a weapon swap - cast every one that's
    //    ready, same as before.
    //  - Self-buffs that don't need the swap (or the swap is already
    //    active) are all cast the same tick they're ready, same as before.
    //    Ones that do need it and aren't available yet are held back.
    //  - Party-buffs are throttled to one cast attempt per tick, because
    //    unlike self-buffs a single entry can apply to several different
    //    targets that all share the same underlying skill cooldown (see
    //    castPartyBuff) - casting on target 2 right after target 1 would
    //    just hit ERR_COOLDOWN.
    //  - Buff gear goes on the moment *anything* (self or party) needs it,
    //    and comes back off only once *nothing* needs it anymore -
    //    regardless of per-entry cooldown state, so a cast that's merely on
    //    a few seconds' cooldown/backoff doesn't cause a pointless
    //    swap-back-then-swap-in-again next tick.
    //
    // Returns true if the caller (botLoopTick) should hold off on
    // window.attack() this tick - either a gear swap is in flight
    // (window.__weaponSwapPending) or we're currently confirmed to be
    // wearing buff gear (a multi-tick sequence, e.g. several party members
    // still need a cast). Attacking while a swap is pending appears to race
    // with it server-side and silently drops the swap, which is why the
    // weapon sometimes never actually changed even though the log said it
    // did - hence the pause, and hence waiting for confirmation rather than
    // just assuming the inv.move worked.
    function maintainBuffs() {
        if (!isOpen(window.__ws)) return false;

        // Resolve/retry/timeout any swap still waiting on inv.update before
        // deciding anything else this tick.
        checkPendingWeaponSwap();
        if (window.__weaponSwapPending) return true;

        for (const item of window.__activeItemBuffs) {
            const groupId = itemBuffGroupId(item.itemId);
            if (!canAttemptBuffCast(groupId)) continue;
            const expiresAt = window.__buffExpiry[groupId];
            if (!expiresAt || (expiresAt - Date.now()) <= window.__buffLeadMs) castItemBuff(item.itemId);
        }

        const selfNeeded = window.__activeBuffs.filter(selfBuffNeedsCast);
        const partyTargets = getPartyBuffTargets();
        const partyNeeded = [];
        for (const entry of window.__partyBuffs) {
            for (const member of partyTargets) {
                if (!memberHasFreshBuff(member, entry.base, window.__buffLeadMs)) {
                    partyNeeded.push({ entry, member });
                }
            }
        }

        const anyNeedsSwapGear = selfNeeded.some(b => b.needsWeaponSwap) || partyNeeded.some(p => p.entry.needsWeaponSwap);

        for (const buff of selfNeeded) {
            if (buff.needsWeaponSwap && !window.__weaponSwappedToBuffGear) continue;
            if (!canAttemptBuffCast(buff.base)) continue;
            addLog(`Refreshing buff: ${buff.fullName}`, 'info');
            castBuff(buff.base);
        }
        const partyActionable = partyNeeded.find(p =>
            (!p.entry.needsWeaponSwap || window.__weaponSwappedToBuffGear) && canAttemptBuffCast(p.entry.base)
        );
        if (partyActionable) castPartyBuff(partyActionable.entry, partyActionable.member);

        if (anyNeedsSwapGear && !window.__weaponSwappedToBuffGear) {
            beginBuffWeaponSwap();
        } else if (!anyNeedsSwapGear && window.__weaponSwappedToBuffGear) {
            restorePrimaryGear();
        }

        return window.__weaponSwappedToBuffGear || !!window.__weaponSwapPending;
    }
    // ---- Item buffs (inventory consumables, self-used and auto-refreshed) ----
    // Confirmed packet format:
    //   OUT { t: "inv.use", d: { bagSlot }, q: N }
    // "q" only shows up on inv.use in the packet captures so far (steadily
    // incrementing, e.g. 171, then 172) - looks like a locally-incrementing
    // counter, not something tied to the item. Mirrored here as a simple
    // counter.
    // buffs.update reports item buffs with groupId "item:<itemId>" (e.g.
    // "item:speed_potion_01" for bag item "speed_potion_01") - NOT the bare
    // itemId - confirmed via a captured inv.use -> buffs.update round trip.
    // itemBuffGroupId() below is the single place that applies that prefix,
    // used whenever we read/write window.__buffExpiry / __buffReadyAt /
    // __buffLastCastAt for an item buff so they line up with what
    // buffs.update actually reports.
    function itemBuffGroupId(itemId) {
        return `item:${itemId}`;
    }
    function findBagSlotForItem(itemId) {
        const bag = window.__inventory && window.__inventory.bag;
        if (!Array.isArray(bag)) return null;
        const idx = bag.findIndex(it => it && it.itemId === itemId);
        return idx === -1 ? null : idx;
    }
    function castItemBuff(itemId) {
        const slot = findBagSlotForItem(itemId);
        if (slot === null) {
            const lastWarn = window.__itemBuffMissingLoggedAt[itemId] || 0;
            if (Date.now() - lastWarn > window.__itemBuffMissingWarnMs) {
                addLog(`Item buff "${itemId}" not found in inventory - skipping.`, 'error');
                window.__itemBuffMissingLoggedAt[itemId] = Date.now();
            }
            return;
        }
        delete window.__itemBuffMissingLoggedAt[itemId];
        window.__sendWS({ t: "inv.use", d: { bagSlot: slot }, q: ++window.__invUseSeq });
        window.__buffLastCastAt[itemBuffGroupId(itemId)] = Date.now();
        addLog(`Refreshing item buff: ${itemId} (bag slot ${slot})`, 'info');
    }
    function addItemBuff(itemId) {
        const id = (itemId || '').trim();
        if (!id) return;
        if (window.__activeItemBuffs.some(i => i.itemId === id)) {
            addLog(`Item buff "${id}" is already active.`, 'info');
            return;
        }
        window.__activeItemBuffs.push({ itemId: id });
        window.__activeItemBuffs.sort((a, b) => a.itemId.localeCompare(b.itemId));
        addLog(`Item buff added: ${id}`, 'info');
        saveActiveItemBuffsForChar();
        updateItemBuffsPanel();
    }
    function removeItemBuff(itemId) {
        const idx = window.__activeItemBuffs.findIndex(i => i.itemId === itemId);
        if (idx !== -1) {
            window.__activeItemBuffs.splice(idx, 1);
            const groupId = itemBuffGroupId(itemId);
            delete window.__buffExpiry[groupId];
            delete window.__buffReadyAt[groupId];
            delete window.__buffLastCastAt[groupId];
            delete window.__buffBackoffMs[groupId];
            delete window.__itemBuffMissingLoggedAt[itemId];
            addLog(`Item buff removed: ${itemId}`, 'error');
            saveActiveItemBuffsForChar();
        } else {
            addLog(`Item buff "${itemId}" is not active.`, 'info');
        }
        updateItemBuffsPanel();
    }
    // ---- Per-character item-buff persistence (localStorage) ----
    const ITEM_BUFFS_STORAGE_KEY = 'sb_active_item_buffs_by_char';
    function loadItemBuffsConfig() {
        try {
            return JSON.parse(localStorage.getItem(ITEM_BUFFS_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function saveActiveItemBuffsForChar() {
        if (!window.__charId) return;
        const cfg = loadItemBuffsConfig();
        cfg[window.__charId] = window.__activeItemBuffs.map(i => i.itemId);
        try {
            localStorage.setItem(ITEM_BUFFS_STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {
            addLog('Could not save item buff config to localStorage.', 'error');
        }
    }
    function restoreActiveItemBuffsForChar() {
        if (!window.__charId) return;
        const cfg = loadItemBuffsConfig();
        const saved = cfg[window.__charId];
        if (!Array.isArray(saved) || saved.length === 0) return;
        // Not filtering against current inventory here (unlike skills/buffs
        // against knownSkills) - a consumable can run out and get
        // restocked, so we keep it configured even if the bag is empty
        // right now; castItemBuff() just skips/logs until it's available.
        window.__activeItemBuffs = saved.map(itemId => ({ itemId })).sort((a, b) => a.itemId.localeCompare(b.itemId));
        addLog(`Restored ${window.__activeItemBuffs.length} saved item buff(s) for this character.`, 'info');
        updateItemBuffsPanel();
    }
    // ---- Per-character buff persistence (localStorage), same pattern as
    // the active-skills persistence below. ----
    const BUFFS_STORAGE_KEY = 'sb_active_buffs_by_char';
    function loadBuffsConfig() {
        try {
            return JSON.parse(localStorage.getItem(BUFFS_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function saveActiveBuffsForChar() {
        if (!window.__charId) return;
        const cfg = loadBuffsConfig();
        cfg[window.__charId] = window.__activeBuffs.map(b => ({ fullName: b.fullName, needsWeaponSwap: !!b.needsWeaponSwap }));
        try {
            localStorage.setItem(BUFFS_STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {
            addLog('Could not save buff config to localStorage.', 'error');
        }
    }
    function restoreActiveBuffsForChar() {
        if (!window.__charId) return;
        const cfg = loadBuffsConfig();
        const saved = cfg[window.__charId];
        if (!Array.isArray(saved) || saved.length === 0) return;
        window.__activeBuffs = [];
        for (const raw of saved) {
            // Older saves stored plain fullName strings (no swap flag yet) -
            // accept both shapes.
            const entry = typeof raw === 'string' ? { fullName: raw, needsWeaponSwap: false } : raw;
            if (!entry || !window.__knownSkills.includes(entry.fullName)) continue;
            const { base, level } = extractSkillParts(entry.fullName);
            if (level === 0 || window.__activeBuffs.some(b => b.base === base)) continue;
            window.__activeBuffs.push({ base, level, fullName: entry.fullName, needsWeaponSwap: !!entry.needsWeaponSwap });
        }
        window.__activeBuffs.sort((a, b) => a.base.localeCompare(b.base));
        if (window.__activeBuffs.length > 0) {
            addLog(`Restored ${window.__activeBuffs.length} saved buff(s) for this character.`, 'info');
            updateBuffStatusPanel();
        }
    }
    // ---- Party auto-accept whitelist (localStorage, global - not tied to
    // a character, since it's really "people I know"). ----
    const PARTY_WHITELIST_STORAGE_KEY = 'sb_party_autoaccept_whitelist';
    function loadPartyWhitelist() {
        try {
            const arr = JSON.parse(localStorage.getItem(PARTY_WHITELIST_STORAGE_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }
    function savePartyWhitelist() {
        try {
            localStorage.setItem(PARTY_WHITELIST_STORAGE_KEY, JSON.stringify(window.__partyAutoAcceptWhitelist));
        } catch (e) {
            addLog('Could not save the party auto-accept whitelist to localStorage.', 'error');
        }
    }
    function isNameWhitelisted(name) {
        const lower = (name || '').toLowerCase();
        return window.__partyAutoAcceptWhitelist.some(n => n.toLowerCase() === lower);
    }
    window.addToPartyWhitelist = function(name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return;
        if (isNameWhitelisted(trimmed)) {
            addLog(`"${trimmed}" is already on the auto-accept whitelist.`, 'info');
            return;
        }
        window.__partyAutoAcceptWhitelist.push(trimmed);
        window.__partyAutoAcceptWhitelist.sort((a, b) => a.localeCompare(b));
        savePartyWhitelist();
        addLog(`Added "${trimmed}" to the auto-accept whitelist.`, 'info');
        updatePartyWhitelistPanel();
    };
    window.removeFromPartyWhitelist = function(name) {
        const before = window.__partyAutoAcceptWhitelist.length;
        window.__partyAutoAcceptWhitelist = window.__partyAutoAcceptWhitelist.filter(n => n.toLowerCase() !== (name || '').toLowerCase());
        if (window.__partyAutoAcceptWhitelist.length !== before) {
            savePartyWhitelist();
            addLog(`Removed "${name}" from the auto-accept whitelist.`, 'error');
            updatePartyWhitelistPanel();
        }
    };
    // ---- Weapon Settings: primary + buff gear (localStorage, per-character). ----
    const WEAPON_SETTINGS_STORAGE_KEY = 'sb_weapon_settings_by_char';
    function loadWeaponSettingsConfig() {
        try {
            return JSON.parse(localStorage.getItem(WEAPON_SETTINGS_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function saveWeaponSettingsForChar() {
        if (!window.__charId) return;
        const cfg = loadWeaponSettingsConfig();
        cfg[window.__charId] = {
            primaryWeaponItemId: window.__primaryWeaponItemId,
            primaryShieldItemId: window.__primaryShieldItemId,
            buffWeaponItemId: window.__buffWeaponItemId,
            buffShieldItemId: window.__buffShieldItemId,
        };
        try {
            localStorage.setItem(WEAPON_SETTINGS_STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {
            addLog('Could not save weapon settings to localStorage.', 'error');
        }
    }
    function restoreWeaponSettingsForChar() {
        if (!window.__charId) return;
        const cfg = loadWeaponSettingsConfig();
        const saved = cfg[window.__charId];
        if (!saved) return;
        window.__primaryWeaponItemId = saved.primaryWeaponItemId || null;
        window.__primaryShieldItemId = saved.primaryShieldItemId || null;
        window.__buffWeaponItemId = saved.buffWeaponItemId || null;
        window.__buffShieldItemId = saved.buffShieldItemId || null;
        if (window.__primaryWeaponItemId || window.__buffWeaponItemId) {
            addLog('Restored weapon settings for this character.', 'info');
        }
        updateWeaponSettingsPanel();
    }
    window.setPrimaryWeapon = function(itemId) {
        window.__primaryWeaponItemId = (itemId || '').trim() || null;
        saveWeaponSettingsForChar();
        addLog(window.__primaryWeaponItemId ? `Primary weapon set: ${window.__primaryWeaponItemId}` : 'Primary weapon cleared.', 'info');
        updateWeaponSettingsPanel();
    };
    window.setPrimaryShield = function(itemId) {
        window.__primaryShieldItemId = (itemId || '').trim() || null;
        saveWeaponSettingsForChar();
        addLog(window.__primaryShieldItemId ? `Primary shield set: ${window.__primaryShieldItemId}` : 'Primary shield cleared.', 'info');
        updateWeaponSettingsPanel();
    };
    window.setBuffWeapon = function(itemId) {
        window.__buffWeaponItemId = (itemId || '').trim() || null;
        saveWeaponSettingsForChar();
        addLog(window.__buffWeaponItemId ? `Buff weapon set: ${window.__buffWeaponItemId}` : 'Buff weapon cleared.', 'info');
        updateWeaponSettingsPanel();
    };
    window.setBuffShield = function(itemId) {
        window.__buffShieldItemId = (itemId || '').trim() || null;
        saveWeaponSettingsForChar();
        addLog(window.__buffShieldItemId ? `Buff shield set: ${window.__buffShieldItemId}` : 'Buff shield cleared.', 'info');
        updateWeaponSettingsPanel();
    };
    // ---- Party buff list (localStorage, per-character - see __partyBuffs
    // for what "party buff" means; buff gear itself lives in Weapon
    // Settings above, shared with self-buffs). ----
    const PARTY_BUFFS_STORAGE_KEY = 'sb_party_buffs_by_char';
    function loadPartyBuffsConfig() {
        try {
            return JSON.parse(localStorage.getItem(PARTY_BUFFS_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function savePartyBuffsForChar() {
        if (!window.__charId) return;
        const cfg = loadPartyBuffsConfig();
        cfg[window.__charId] = window.__partyBuffs.map(b => ({ fullName: b.fullName, needsWeaponSwap: !!b.needsWeaponSwap }));
        try {
            localStorage.setItem(PARTY_BUFFS_STORAGE_KEY, JSON.stringify(cfg));
        } catch (e) {
            addLog('Could not save party buffs to localStorage.', 'error');
        }
    }
    function restorePartyBuffsForChar() {
        if (!window.__charId) return;
        const cfg = loadPartyBuffsConfig();
        const saved = cfg[window.__charId];
        if (!Array.isArray(saved) || saved.length === 0) return;
        window.__partyBuffs = [];
        for (const entry of saved) {
            if (!entry || !window.__knownSkills.includes(entry.fullName)) continue;
            const { base, level } = extractSkillParts(entry.fullName);
            if (level === 0 || window.__partyBuffs.some(b => b.base === base)) continue;
            window.__partyBuffs.push({ base, level, fullName: entry.fullName, needsWeaponSwap: !!entry.needsWeaponSwap });
        }
        if (window.__partyBuffs.length > 0) {
            addLog(`Restored ${window.__partyBuffs.length} party buff(s) for this character.`, 'info');
        }
        updatePartyBuffsPanel();
    }
    window.addPartyBuff = function(fullName, needsWeaponSwap) {
        const { base, level } = extractSkillParts(fullName);
        if (level === 0) {
            addLog(`Party buff "${fullName}" has no level suffix - ignored.`, 'error');
            return;
        }
        if (window.__partyBuffs.some(b => b.base === base)) {
            addLog(`Party buff "${base}" is already configured.`, 'info');
            return;
        }
        window.__partyBuffs.push({ base, level, fullName, needsWeaponSwap: !!needsWeaponSwap });
        window.__partyBuffs.sort((a, b) => a.base.localeCompare(b.base));
        addLog(`Party buff added: ${fullName}${needsWeaponSwap ? ' (needs weapon swap)' : ''}`, 'info');
        savePartyBuffsForChar();
        updatePartyBuffsPanel();
    };
    window.removePartyBuff = function(fullName) {
        const idx = window.__partyBuffs.findIndex(b => b.fullName === fullName);
        if (idx !== -1) {
            const removed = window.__partyBuffs.splice(idx, 1)[0];
            addLog(`Party buff removed: ${removed.fullName}`, 'error');
            savePartyBuffsForChar();
        } else {
            addLog(`Party buff "${fullName}" is not configured.`, 'info');
        }
        updatePartyBuffsPanel();
    };
    window.setPartyBuffNeedsSwap = function(fullName, needsSwap) {
        const entry = window.__partyBuffs.find(b => b.fullName === fullName);
        if (!entry) return;
        entry.needsWeaponSwap = !!needsSwap;
        savePartyBuffsForChar();
        addLog(`Party buff "${fullName}" weapon swap: ${entry.needsWeaponSwap ? 'ON' : 'OFF'}`, 'info');
    };
    function getAvailableSkills() {
        if (window.__knownSkills.length === 0) {
            addLog('No known skills yet. Waiting for zone.init (log in / enter a zone)...', 'info');
            return;
        }
        showSkillsModal();
    }
    // Collapses knownSkills down to one entry per base skill, keeping only
    // the highest tier/level (e.g. "wizard_spiritp_earth_a_1".."_6" -> just
    // "..._a_6"). Skills without a numeric suffix pass through unchanged.
    function getHighestTierSkills() {
        const bestByBase = new Map();
        for (const fullName of window.__knownSkills) {
            const { base, level } = extractSkillParts(fullName);
            const current = bestByBase.get(base);
            if (!current || level > current.level) {
                bestByBase.set(base, { fullName, level });
            }
        }
        return Array.from(bestByBase.values())
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
            .map(s => s.fullName);
    }
    // ---- Available Skills modal: lists every skill reported by the game
    // with an inline Add/Remove button, instead of just dumping text into
    // the log. ----
    function showSkillsModal() {
        let modal = document.getElementById('sb-skills-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sb-skills-modal';
            modal.innerHTML = `
                <div class="sb-modal-backdrop"></div>
                <div class="sb-modal-content">
                    <div class="sb-modal-header">
                        <span class="sb-modal-title">Available Skills</span>
                        <span class="sb-modal-close" id="sb-skills-modal-close">&times;</span>
                    </div>
                    <div class="sb-modal-body" id="sb-skills-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.sb-modal-backdrop').addEventListener('click', closeSkillsModal);
            document.getElementById('sb-skills-modal-close').addEventListener('click', closeSkillsModal);
        }
        renderSkillsModalBody();
    }
    function closeSkillsModal() {
        const modal = document.getElementById('sb-skills-modal');
        if (modal) modal.remove();
    }
    function renderSkillsModalBody() {
        const body = document.getElementById('sb-skills-modal-body');
        if (!body) return;
        if (window.__knownSkills.length === 0) {
            body.innerHTML = `<div class="sb-modal-empty">No known skills yet. Waiting for zone.init (log in / enter a zone)...</div>`;
            return;
        }
        body.innerHTML = getHighestTierSkills().map(s => {
            const isActive = window.__activeSkills.some(a => a.fullName === s);
            const isBuff = window.__activeBuffs.some(b => b.fullName === s);
            const isPartyBuff = window.__partyBuffs.some(b => b.fullName === s);
            return `
                <div class="sb-modal-skill-row">
                    <span class="sb-modal-skill-name" title="${s}">${skillLabel(s)}</span>
                    <span class="sb-modal-skill-btns">
                        <button class="sb-modal-skill-btn ${isActive ? 'remove' : 'add'}" data-action="skill" data-skill="${s}">${isActive ? 'Remove' : 'Add'}</button>
                        <button class="sb-modal-skill-btn ${isBuff ? 'remove' : 'buff'}" data-action="buff" data-skill="${s}">${isBuff ? 'Remove Buff' : 'Add Buff'}</button>
                        <button class="sb-modal-skill-btn ${isPartyBuff ? 'remove' : 'buff'}" data-action="partybuff" data-skill="${s}">${isPartyBuff ? 'Remove Party Buff' : 'Add Party Buff'}</button>
                    </span>
                </div>
            `;
        }).join('');
        body.querySelectorAll('.sb-modal-skill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const skill = btn.getAttribute('data-skill');
                const action = btn.getAttribute('data-action');
                if (action === 'buff') {
                    const isBuff = window.__activeBuffs.some(b => b.fullName === skill);
                    if (isBuff) {
                        window.removeBuff(skill);
                    } else {
                        window.addBuff(skill);
                    }
                } else if (action === 'partybuff') {
                    const isPartyBuff = window.__partyBuffs.some(b => b.fullName === skill);
                    if (isPartyBuff) {
                        window.removePartyBuff(skill);
                    } else {
                        window.addPartyBuff(skill, false);
                    }
                    updatePartyBuffsPanel();
                } else {
                    const isActive = window.__activeSkills.some(a => a.fullName === skill);
                    if (isActive) {
                        window.removeSkill(skill);
                    } else {
                        window.addSkill(skill);
                    }
                }
                renderSkillsModalBody();
            });
        });
    }
    // ---- Inventory modal: browse the bag and mark items as auto-used
    // item buffs. Reuses the same .sb-modal-* styling as the skills modal. ----
    function showInventoryModal() {
        let modal = document.getElementById('sb-inventory-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'sb-inventory-modal';
            modal.innerHTML = `
                <div class="sb-modal-backdrop"></div>
                <div class="sb-modal-content">
                    <div class="sb-modal-header">
                        <span class="sb-modal-title">Inventory &amp; Gear</span>
                        <span class="sb-modal-close" id="sb-inventory-modal-close">&times;</span>
                    </div>
                    <div class="sb-modal-body" id="sb-inventory-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.sb-modal-backdrop').addEventListener('click', closeInventoryModal);
            document.getElementById('sb-inventory-modal-close').addEventListener('click', closeInventoryModal);
        }
        renderInventoryModalBody();
    }
    function closeInventoryModal() {
        const modal = document.getElementById('sb-inventory-modal');
        if (modal) modal.remove();
    }
    // Gear-assignment buttons (Primary/Buff x Weapon/Shield) - used for both
    // the equipped-gear summary row and every bag row below, so any of the
    // four can be picked either from what's currently worn or from the bag,
    // without typing an itemId. GEAR_KINDS is the single place mapping each
    // kind to its backing state field, setter, and short label.
    const GEAR_KINDS = {
        primaryWeapon: { get: () => window.__primaryWeaponItemId, set: window.setPrimaryWeapon, label: 'Primary Wpn' },
        primaryShield: { get: () => window.__primaryShieldItemId, set: window.setPrimaryShield, label: 'Primary Shd' },
        weapon: { get: () => window.__buffWeaponItemId, set: window.setBuffWeapon, label: 'Buff Wpn' },
        shield: { get: () => window.__buffShieldItemId, set: window.setBuffShield, label: 'Buff Shd' },
    };
    function gearButtonHtml(kind, itemId) {
        const cfg = GEAR_KINDS[kind];
        const isSelected = itemId && cfg.get() === itemId;
        return `<button class="sb-modal-skill-btn ${isSelected ? 'remove' : 'buff'}" data-gear="${kind}" data-item="${itemId}">${isSelected ? `✓ ${cfg.label}` : cfg.label}</button>`;
    }
    function renderInventoryModalBody() {
        const body = document.getElementById('sb-inventory-modal-body');
        if (!body) return;
        const equip = window.__inventory.equip || {};
        const equipWeaponId = equip.weapon ? equip.weapon.itemId : null;
        const equipShieldId = equip.shield ? equip.shield.itemId : null;
        const bag = window.__inventory.bag || [];
        const slots = bag
            .map((item, idx) => ({ item, idx }))
            .filter(x => x.item && x.item.itemId);
        let html = '';
        if (equipWeaponId || equipShieldId) {
            html += `<div class="sb-modal-equip-summary">`;
            if (equipWeaponId) {
                html += `
                    <div class="sb-modal-skill-row">
                        <span class="sb-modal-skill-name">Equipped weapon: ${equipWeaponId}</span>
                        <span class="sb-modal-skill-btns">${gearButtonHtml('primaryWeapon', equipWeaponId)}${gearButtonHtml('weapon', equipWeaponId)}</span>
                    </div>
                `;
            }
            if (equipShieldId) {
                html += `
                    <div class="sb-modal-skill-row">
                        <span class="sb-modal-skill-name">Equipped shield: ${equipShieldId}</span>
                        <span class="sb-modal-skill-btns">${gearButtonHtml('primaryShield', equipShieldId)}${gearButtonHtml('shield', equipShieldId)}</span>
                    </div>
                `;
            }
            html += `</div><div class="panel-section-title">Bag</div>`;
        }
        if (slots.length === 0) {
            html += equipWeaponId || equipShieldId ? '' : `<div class="sb-modal-empty">No inventory data yet. Waiting for zone.init / inv.update...</div>`;
            body.innerHTML = html;
            return;
        }
        html += slots.map(({ item, idx }) => {
            const isBuff = window.__activeItemBuffs.some(i => i.itemId === item.itemId);
            const qtyText = item.qty !== undefined ? ` x${item.qty}` : '';
            return `
                <div class="sb-modal-skill-row">
                    <span class="sb-modal-skill-name">${item.itemId}${qtyText} <span class="panel-skill-timer">(slot ${idx})</span></span>
                    <span class="sb-modal-skill-btns">
                        <button class="sb-modal-skill-btn ${isBuff ? 'remove' : 'buff'}" data-item-buff="${item.itemId}">${isBuff ? 'Remove Buff' : 'Add Buff'}</button>
                        ${gearButtonHtml('primaryWeapon', item.itemId)}
                        ${gearButtonHtml('primaryShield', item.itemId)}
                        ${gearButtonHtml('weapon', item.itemId)}
                        ${gearButtonHtml('shield', item.itemId)}
                    </span>
                </div>
            `;
        }).join('');
        body.innerHTML = html;
        body.querySelectorAll('[data-item-buff]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-item-buff');
                const isBuff = window.__activeItemBuffs.some(i => i.itemId === itemId);
                if (isBuff) {
                    window.removeItemBuff(itemId);
                } else {
                    window.addItemBuff(itemId);
                }
                renderInventoryModalBody();
            });
        });
        body.querySelectorAll('[data-gear]').forEach(btn => {
            btn.addEventListener('click', () => {
                const kind = btn.getAttribute('data-gear');
                const itemId = btn.getAttribute('data-item');
                const cfg = GEAR_KINDS[kind];
                cfg.set(cfg.get() === itemId ? null : itemId);
                renderInventoryModalBody();
            });
        });
    }
    // ============================================================
    //  6. ENTITY CACHE & DISTANCE
    // ============================================================
    // Entities keep a `lastSeen` timestamp so stale ones (still in the
    // cache but no longer actually near the player - the game apparently
    // doesn't always send an explicit remove for those) can be pruned. See
    // pruneStaleEntities() below.
    function cacheEntity(entity) {
        if (entity && entity.id) {
            const id = typeof entity.id === 'string' ? parseInt(entity.id, 10) : entity.id;
            const existing = window.__entityCache[id];
            window.__entityCache[id] = {
                name: entity.name || (existing ? existing.name : 'Unknown'),
                kind: entity.kind || (existing ? existing.kind : 'unknown'),
                x: entity.x !== undefined ? entity.x : (existing ? existing.x : undefined),
                z: entity.z !== undefined ? entity.z : (existing ? existing.z : undefined),
                // Gatherable job nodes (kind: "npc") carry these extra
                // fields - npcId identifies the node type (e.g. "node_tree"),
                // nodeGrade its yield tier (seen: blue/green/red).
                npcId: entity.npcId !== undefined ? entity.npcId : (existing ? existing.npcId : undefined),
                nodeGrade: entity.nodeGrade !== undefined ? entity.nodeGrade : (existing ? existing.nodeGrade : undefined),
                modelKey: entity.modelKey !== undefined ? entity.modelKey : (existing ? existing.modelKey : undefined),
                lastSeen: Date.now(),
            };
        }
    }
    function getEntityName(id) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        const entry = window.__entityCache[numId];
        return entry ? entry.name : null;
    }
    function getMonsters() {
        const result = [];
        for (const [id, data] of Object.entries(window.__entityCache)) {
            if (data.kind === 'monster') {
                result.push({ id: parseInt(id, 10), ...data });
            }
        }
        return result;
    }
    // ---- Job nodes (gatherable resources: trees, ore, ...) ----
    // Maps a node's npcId to a friendly job/profession label. Add new
    // entries here as new node types show up in the log (e.g. a mining
    // node) - everything else (grade, distance, gather button) already
    // works for any npcId; unmapped ones just fall back to showing the
    // raw npcId in the Job tab instead of a friendly name.
    window.__jobNodeTypes = {
        node_tree: 'Lumberjack',
    };
    function getJobLabel(npcId) {
        return window.__jobNodeTypes[npcId] || npcId || 'Unknown';
    }
    function getJobNodes() {
        const result = [];
        for (const [id, data] of Object.entries(window.__entityCache)) {
            if (data.kind === 'npc' && data.npcId) {
                result.push({ id: parseInt(id, 10), ...data });
            }
        }
        return result;
    }
    function findClosestMonster() {
        const monsters = getMonsters().filter(m => m.x !== undefined && m.z !== undefined);
        if (monsters.length === 0) return null;
        const px = window.__playerPos.x;
        const pz = window.__playerPos.z;
        // Leveling radius: only consider monsters within __botRadius of the
        // center captured when Start Bot was pressed (window.__botCenter).
        // Radius <= 0 means unlimited, same as before this was added.
        const center = window.__botCenter;
        const radius = window.__botRadius;
        const useRadius = radius > 0 && center;
        const now = Date.now();
        let closest = null;
        let minDist = Infinity;
        for (const m of monsters) {
            // Skip monsters we recently gave up on (behind an obstacle) so
            // they don't get immediately re-picked as "closest" again.
            const blockedUntil = window.__blockedUntil[m.id];
            if (blockedUntil && now < blockedUntil) continue;
            if (useRadius) {
                const cdx = m.x - center.x;
                const cdz = m.z - center.z;
                if (cdx * cdx + cdz * cdz > radius * radius) continue;
            }
            const dx = m.x - px;
            const dz = m.z - pz;
            const dist = dx*dx + dz*dz;
            if (dist < minDist) {
                minDist = dist;
                closest = m;
            }
        }
        return closest;
    }
    // Removes entities that haven't received any update (position, cache
    // refresh, etc.) in a while. The game doesn't seem to reliably tell us
    // when a monster leaves render range / despawns, so entries were
    // piling up and the bot kept trying to fight or target monsters that
    // were long gone. Run periodically (see Monster Radar panel setup).
    function pruneStaleEntities() {
        const now = Date.now();
        let removedAny = false;
        for (const [idStr, data] of Object.entries(window.__entityCache)) {
            const id = parseInt(idStr, 10);
            if (id === window.__playerId || data.kind === 'player') continue;
            if (!data.lastSeen) {
                data.lastSeen = now; // legacy entry without a timestamp yet
                continue;
            }
            if (now - data.lastSeen > window.__staleEntityMs) {
                delete window.__entityCache[id];
                removedAny = true;
                if (window.__currentTarget === id) {
                    window.__currentTarget = null;
                    window.__isFighting = false;
                    window.__skillIndex = 0;
                    addLog(`Target ${id} went stale (no updates for ${Math.round(window.__staleEntityMs / 1000)}s) - clearing target.`, 'error');
                }
            }
        }
        return removedAny;
    }
    // Manual escape hatch: wipe every cached monster so the radar and
    // targeting rebuild purely from the next zone.init / state.delta.
    function clearMonsterCache() {
        for (const [idStr, data] of Object.entries(window.__entityCache)) {
            if (data.kind === 'monster') delete window.__entityCache[idStr];
        }
        if (window.__currentTarget && !window.__entityCache[window.__currentTarget]) {
            window.__currentTarget = null;
            window.__isFighting = false;
            window.__skillIndex = 0;
        }
        updateMonsterPanel();
        updateStatus();
        addLog('Monster cache cleared manually.', 'info');
    }
    // ============================================================
    //  7. LOOT QUEUE
    // ============================================================
    function enqueuePickup(itemId) {
        const numId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
        if (!window.__pickupQueue.includes(numId)) {
            window.__pickupQueue.push(numId);
            addLog(`Item ${numId} added to loot queue`, 'loot');
        }
        if (!window.__isPickingUp) {
            processPickupQueue();
        }
    }
    // Only one loot.pickup request is sent at a time. We wait for a
    // confirmation (entity.pickup) before requesting the next item. Sending
    // pickup requests back to back appears to interrupt the walk-to-item
    // movement of the first request, so only the last requested item was
    // ever actually picked up.
    function processPickupQueue() {
        if (window.__pickupQueue.length === 0) {
            window.__isPickingUp = false;
            window.__currentPickupId = null;
            if (window.__pickupTimer) {
                clearTimeout(window.__pickupTimer);
                window.__pickupTimer = null;
            }
            return;
        }
        window.__isPickingUp = true;
        // Peek, don't shift - the item stays queued until confirmed or
        // abandoned after too many retries.
        const itemId = window.__pickupQueue[0];
        window.__currentPickupId = itemId;
        window.__sendWS({ t: "loot.pickup", d: { id: itemId } });
        if (window.__pickupTimer) clearTimeout(window.__pickupTimer);
        window.__pickupTimer = setTimeout(() => {
            const retries = (window.__pickupRetries[itemId] || 0) + 1;
            window.__pickupRetries[itemId] = retries;
            if (retries > window.__pickupMaxRetries) {
                addLog(`Item ${itemId} not confirmed after ${retries} attempts - skipping.`, 'error');
                if (window.__pickupQueue[0] === itemId) window.__pickupQueue.shift();
                delete window.__pickupRetries[itemId];
            } else {
                addLog(`No confirmation for item ${itemId}, retrying (${retries}/${window.__pickupMaxRetries})...`, 'loot');
            }
            processPickupQueue();
        }, window.__pickupTimeoutMs);
    }
    function onPickupSuccess() {
        if (window.__pickupTimer) {
            clearTimeout(window.__pickupTimer);
            window.__pickupTimer = null;
        }
        if (window.__pickupQueue.length > 0 && window.__pickupQueue[0] === window.__currentPickupId) {
            window.__pickupQueue.shift();
        } else if (window.__pickupQueue.length > 0) {
            window.__pickupQueue.shift();
        }
        if (window.__currentPickupId !== null) {
            delete window.__entityCache[window.__currentPickupId];
        }
        delete window.__pickupRetries[window.__currentPickupId];
        window.__currentPickupId = null;
        processPickupQueue();
    }
    // ============================================================
    //  8. MESSAGE HANDLING
    // ============================================================
    function getMaxValues(obj) {
        let maxHp, maxMp;
        if (obj.maxHp !== undefined) maxHp = obj.maxHp;
        if (obj.maxMp !== undefined) maxMp = obj.maxMp;
        if (obj.derived && obj.derived.maxHp !== undefined) maxHp = obj.derived.maxHp;
        if (obj.derived && obj.derived.maxMp !== undefined) maxMp = obj.derived.maxMp;
        return { maxHp, maxMp };
    }
    function summarizeEntities(entities) {
        if (!Array.isArray(entities)) return;
        const monsters = entities.filter(e => e.kind === 'monster');
        const items = entities.filter(e => e.kind === 'ground_item');
        const nodes = entities.filter(e => e.kind === 'npc' && e.npcId);
        entities.forEach(e => cacheEntity(e));
        if (monsters.length) {
            // Monster details live in the Monster Radar window only.
            updateMonsterPanel();
        }
        if (nodes.length) {
            // Job node details live in the Job tab only.
            updateJobPanel();
        }
        if (items.length) {
            addLog(`${items.length} ground item(s):`, 'loot');
            items.forEach(item => {
                addLog(`  ${item.name} (ID: ${item.id}) at (${item.x?.toFixed(2)}, ${item.z?.toFixed(2)})`, 'loot');
                enqueuePickup(item.id);
            });
        }
    }
    // ============================================================
    //  8b. MONSTER RADAR (separate window, no log spam)
    // ============================================================
    function updateMonsterPanel() {
        const countEl = document.getElementById('sb-monster-count');
        const bodyEl = document.getElementById('sb-monster-table-body');
        if (!countEl || !bodyEl) return;
        const px = window.__playerPos.x;
        const pz = window.__playerPos.z;
        const withDist = getMonsters()
            .filter(m => m.x !== undefined && m.z !== undefined)
            .map(m => {
                const dx = m.x - px;
                const dz = m.z - pz;
                return { ...m, dist: Math.sqrt(dx * dx + dz * dz) };
            })
            .sort((a, b) => a.dist - b.dist);
        countEl.textContent = `${withDist.length} monster(s) nearby`;
        if (withDist.length === 0) {
            bodyEl.innerHTML = `<tr><td colspan="6" style="color:#666;">No monsters detected</td></tr>`;
            return;
        }
        bodyEl.innerHTML = withDist.map((m, i) => `
            <tr class="${i === 0 ? 'closest' : ''}">
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.dist.toFixed(1)}</td>
                <td>${m.x.toFixed(1)}</td>
                <td>${m.z.toFixed(1)}</td>
                <td><button class="monster-attack-btn" data-target-id="${m.id}">Attack</button></td>
            </tr>
        `).join('');
        bodyEl.querySelectorAll('.monster-attack-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-target-id'), 10);
                window.attack(id);
            });
        });
    }
    // ============================================================
    //  8c. JOB TAB (gatherable nodes: trees, ore, ...)
    // ============================================================
    function updateJobPanel() {
        const profEl = document.getElementById('sb-job-profession');
        if (profEl) {
            if (!Array.isArray(window.__professions) || window.__professions.length === 0) {
                profEl.textContent = 'No profession data yet.';
            } else {
                profEl.innerHTML = window.__professions.map(p => {
                    const pct = p.xpToNext > 0 ? Math.round((p.xp / p.xpToNext) * 100) : 0;
                    const label = p.id ? p.id.charAt(0).toUpperCase() + p.id.slice(1) : 'Unknown';
                    return `${label} Lv.${p.level} (${p.xp}/${p.xpToNext} XP, ${pct}%)`;
                }).join(' &nbsp;|&nbsp; ');
            }
        }
        const countEl = document.getElementById('sb-job-count');
        const bodyEl = document.getElementById('sb-job-table-body');
        if (!countEl || !bodyEl) return;
        const px = window.__playerPos.x;
        const pz = window.__playerPos.z;
        const withDist = getJobNodes()
            .filter(n => n.x !== undefined && n.z !== undefined)
            .map(n => {
                const dx = n.x - px;
                const dz = n.z - pz;
                return { ...n, dist: Math.sqrt(dx * dx + dz * dz) };
            })
            .sort((a, b) => a.dist - b.dist);
        countEl.textContent = `${withDist.length} node(s) nearby`;
        if (withDist.length === 0) {
            bodyEl.innerHTML = `<tr><td colspan="6" style="color:#666;">No gatherable nodes detected</td></tr>`;
            return;
        }
        bodyEl.innerHTML = withDist.map((n, i) => {
            const isThisNode = window.__currentGatherNodeId === n.id;
            const disabled = window.__isGathering && !isThisNode;
            const label = isThisNode ? 'Gathering…' : 'Gather';
            return `
            <tr class="${i === 0 ? 'closest' : ''}">
                <td>${n.id}</td>
                <td>${n.name}</td>
                <td class="node-grade-${n.nodeGrade || ''}">${n.nodeGrade || '-'}</td>
                <td>${getJobLabel(n.npcId)}</td>
                <td>${n.dist.toFixed(1)}</td>
                <td><button class="job-gather-btn" data-node-id="${n.id}" ${(disabled || isThisNode) ? 'disabled' : ''}>${label}</button></td>
            </tr>
        `;
        }).join('');
        bodyEl.querySelectorAll('.job-gather-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-node-id'), 10);
                window.gatherNode(id);
            });
        });
    }
    // Fixed HP/MP display, updated in place instead of flooding the log.
    function updateVitalsDisplay() {
        const el = document.getElementById('sb-status-vitals');
        if (!el) return;
        const hp = window.__hp;
        const mp = window.__mp;
        const maxHp = window.__maxHp;
        const maxMp = window.__maxMp;
        if (hp === null && mp === null) {
            el.textContent = 'Vitals: waiting for data...';
            el.className = 'panel-status-line';
            return;
        }
        const hpPct = (typeof hp === 'number' && typeof maxHp === 'number' && maxHp > 0)
            ? Math.round((hp / maxHp) * 100) : null;
        const mpPct = (typeof mp === 'number' && typeof maxMp === 'number' && maxMp > 0)
            ? Math.round((mp / maxMp) * 100) : null;
        const low = hpPct !== null && hpPct <= 25;
        el.className = `panel-status-line ${low ? 'status-error' : 'status-ok'}`;
        el.textContent = `HP: ${hp ?? '?'}/${maxHp ?? '?'}${hpPct !== null ? ` (${hpPct}%)` : ''}   MP: ${mp ?? '?'}/${maxMp ?? '?'}${mpPct !== null ? ` (${mpPct}%)` : ''}`;
    }
    function logSpecial(msg) {
        // ERR_NOT_FOUND
        if (msg.t === 'err' && msg.d && msg.d.code === 'ERR_NOT_FOUND') {
            let targetId = msg.d.targetId;
            if (targetId) {
                const numId = typeof targetId === 'string' ? parseInt(targetId, 10) : targetId;
                delete window.__entityCache[numId];
                addLog(`Removed invalid ID ${numId} from cache (ERR_NOT_FOUND)`, 'error');
                if (window.__currentTarget === numId) {
                    window.__currentTarget = null;
                    window.__isFighting = false;
                    window.__skillIndex = 0;
                    addLog('Combat cancelled - target not found', 'error');
                }
            }
            return true;
        }
        // cast.ok - confirms a skill.cast succeeded and, crucially, tells us
        // exactly when it's castable again: { groupId, readyAt } where
        // readyAt is the absolute epoch ms cooldown-expiry (confirmed via a
        // captured skill.cast -> cast.ok round trip: wizard_eartha_guard_a's
        // readyAt was exactly 60000ms after skill.fire's "at", i.e. a flat
        // 60s cooldown). This is authoritative, so it drives
        // canAttemptBuffCast() directly - no guessing needed for skills.
        // Tracked for every cast.ok, not just buffs, in case combat-skill
        // cooldown-awareness is wanted later too.
        if (msg.t === 'cast.ok' && msg.d && msg.d.groupId && typeof msg.d.readyAt === 'number') {
            window.__buffReadyAt[msg.d.groupId] = msg.d.readyAt;
            return true;
        }
        // ERR_COOLDOWN (or similar) - confirmed shape is just
        // { code: "ERR_COOLDOWN" }, no groupId and no remaining-time hint.
        // Fallback path for when we attempt a cast without an
        // already-known readyAt (e.g. right after the page loads, before
        // any cast.ok has been seen for this groupId yet - applies to
        // combat skill rotation just as much as self-buffs) and it turns
        // out to still be on cooldown. Since the error carries no
        // identifying info, this best-effort-matches it to whichever
        // tracked skill/buff/item we most recently tried to (re)cast, and
        // grows a backoff so attack()/maintainBuffs() stop hammering it
        // every tick (the remaining-time branch below is speculative in
        // case some other error variant does include one). If this still
        // spams, capture a fresh ERR_COOLDOWN packet (Debug tab -> Copy
        // Packet Log) so the real field names can be wired in here.
        if (msg.t === 'err' && msg.d && /cooldown/i.test(msg.d.code || '')) {
            const d = msg.d;
            let groupId = d.groupId || d.skillId || (d.itemId ? itemBuffGroupId(d.itemId) : null) || null;
            if (!groupId) {
                const candidates = [
                    ...window.__activeSkills.map(s => s.base),
                    ...window.__activeBuffs.map(b => b.base),
                    ...window.__activeItemBuffs.map(i => itemBuffGroupId(i.itemId))
                ];
                let latestAt = 0;
                for (const id of candidates) {
                    const at = window.__buffLastCastAt[id] || 0;
                    if (at > latestAt) { latestAt = at; groupId = id; }
                }
            }
            if (groupId) {
                const remainingMs = d.remainingMs ?? d.remaining ?? d.cooldownMs
                    ?? d.retryAfterMs ?? (typeof d.retryAfter === 'number' ? d.retryAfter * 1000 : undefined);
                if (typeof remainingMs === 'number' && remainingMs > 0) {
                    window.__buffReadyAt[groupId] = Date.now() + remainingMs;
                    addLog(`"${groupId}" on cooldown - ~${Math.round(remainingMs / 1000)}s remaining (learned).`, 'error');
                } else {
                    const backoff = bumpBuffBackoff(groupId);
                    addLog(`"${groupId}" on cooldown - backing off ${Math.round(backoff / 1000)}s before retrying.`, 'error');
                }
            } else {
                addLog(`Cooldown error received (${d.code}) but couldn't tell which skill/item it was for.`, 'error');
            }
            return true;
        }
        // entity.move - cache only, no log line (would spam heavily with
        // many moving monsters). Live positions are shown in the Monster
        // Radar window, which refreshes itself on an interval.
        if (msg.t === 'entity.move' && msg.d && msg.d.id) {
            const id = typeof msg.d.id === 'string' ? parseInt(msg.d.id, 10) : msg.d.id;
            const x = msg.d.x ?? msg.d.tx;
            const z = msg.d.z ?? msg.d.tz;
            if (id === window.__playerId && x !== undefined && z !== undefined) {
                window.__playerPos.x = x;
                window.__playerPos.z = z;
            }
            const entry = window.__entityCache[id];
            if (entry) {
                entry.lastSeen = Date.now();
                if (x !== undefined && z !== undefined) {
                    entry.x = x;
                    entry.z = z;
                }
            }
            window.__lastTargetId = id;
            return true;
        }
        // entity.stop - position update only
        if (msg.t === 'entity.stop' && msg.d) {
            const id = typeof msg.d.id === 'string' ? parseInt(msg.d.id, 10) : msg.d.id;
            const x = msg.d.x;
            const z = msg.d.z;
            if (id === window.__playerId && x !== undefined && z !== undefined) {
                window.__playerPos.x = x;
                window.__playerPos.z = z;
            }
            const entry = window.__entityCache[id];
            if (entry) entry.lastSeen = Date.now();
            if (entry && x !== undefined && z !== undefined) {
                entry.x = x;
                entry.z = z;
            }
            return true;
        }
        // vitals.update - fixed display, not logged
        if (msg.t === 'vitals.update' && msg.d) {
            window.__hp = msg.d.hp;
            window.__mp = msg.d.mp;
            updateVitalsDisplay();
            return true;
        }
        // buffs.update - current buff list for an entity. Only tracked for
        // the player; treated as the full authoritative snapshot (not a
        // delta), so it fully replaces the expiry map each time.
        if (msg.t === 'buffs.update' && msg.d && Array.isArray(msg.d.buffs)) {
            const entityId = typeof msg.d.id === 'string' ? parseInt(msg.d.id, 10) : msg.d.id;
            if (entityId === window.__playerId) {
                const current = {};
                msg.d.buffs.forEach(b => {
                    current[b.groupId] = b.expiresAt;
                    // A confirmed buff means the last cast for this groupId
                    // went through - reset the unknown-cooldown backoff so a
                    // stale, inflated value from an earlier rejection
                    // doesn't linger.
                    window.__buffBackoffMs[b.groupId] = window.__buffBackoffBaseMs;
                });
                window.__buffExpiry = current;
                updateBuffStatusPanel();
            }
            return true;
        }
        // zone.init
        if (msg.t === 'zone.init' && msg.d) {
            const self = msg.d.self || msg.d;
            const { maxHp, maxMp } = getMaxValues(self);
            if (maxHp !== undefined) window.__maxHp = maxHp;
            if (maxMp !== undefined) window.__maxMp = maxMp;
            if (self.entityId) {
                window.__playerId = typeof self.entityId === 'string' ? parseInt(self.entityId, 10) : self.entityId;
                cacheEntity({ id: window.__playerId, name: self.name, kind: 'player' });
                addLog(`Player: ${self.name} (ID: ${window.__playerId})`, 'info');
            }
            if (self.charId) {
                window.__charId = self.charId;
            }
            if (self.inventory) {
                window.__inventory = {
                    gold: self.inventory.gold ?? 0,
                    bag: Array.isArray(self.inventory.bag) ? self.inventory.bag : [],
                    equip: self.inventory.equip || {}
                };
            }
            updateVitalsDisplay();
            if (Array.isArray(msg.d.entities)) {
                summarizeEntities(msg.d.entities);
            }
            if (Array.isArray(self.knownSkills)) {
                window.__knownSkills = self.knownSkills;
                addLog(`${self.knownSkills.length} skill(s) available. Use getAvailableSkills() to list them.`, 'info');
                if (document.getElementById('sb-skills-modal')) renderSkillsModalBody();
                // Auto-restore this character's saved skill loadout, but only
                // once per session per character (zone.init also fires on
                // zone changes, not just character selection).
                if (window.__charId && window.__skillsRestoredForCharId !== window.__charId) {
                    restoreActiveSkillsForChar();
                    restoreActiveBuffsForChar();
                    restoreActiveItemBuffsForChar();
                    restoreWeaponSettingsForChar();
                    restorePartyBuffsForChar();
                    window.__skillsRestoredForCharId = window.__charId;
                }
            }
            updateStatus();
            return false;
        }
        // progress.update - compact output
        if (msg.t === 'progress.update' && msg.d) {
            const xp = msg.d.xp ?? '?';
            const xpToNext = msg.d.xpToNext ?? 1;
            const sp = msg.d.sp ?? '?';
            const spExp = msg.d.spExp ?? '?';
            const spExpToNext = msg.d.spExpToNext ?? 1;
            const xpPercent = xpToNext > 0 ? Math.round((xp / xpToNext) * 100) : 0;
            const spPercent = spExpToNext > 0 ? Math.round((spExp / spExpToNext) * 100) : 0;
            addLog(`XP: ${xp}/${xpToNext} (${xpPercent}%)  SP: ${sp} (${spExp}/${spExpToNext}, ${spPercent}%)`, 'xp');
            return true;
        }
        // combat.death
        if (msg.t === 'combat.death' && msg.d) {
            const killedId = typeof msg.d.id === 'string' ? parseInt(msg.d.id, 10) : msg.d.id;
            const killerId = typeof msg.d.killerId === 'string' ? parseInt(msg.d.killerId, 10) : msg.d.killerId;
            const isOwn = (killerId === window.__playerId);
            const name = getEntityName(killedId) || killedId;
            addLog(`${name} (ID: ${killedId}) was killed${isOwn ? ' (by you)' : ''}`, 'info');

            delete window.__entityCache[killedId];
            updateMonsterPanel();

            if (killedId === window.__currentTarget) {
                window.__currentTarget = null;
                window.__isFighting = false;
                window.__skillIndex = 0;
                resetStuckState();
                addLog('Combat ended - target down.', 'info');
                if (window.__pickupQueue.length > 0) {
                    addLog('Starting automatic loot pickup...', 'loot');
                    processPickupQueue();
                }
            }
            updateStatus();
            return true;
        }
        // combat.event
        if (msg.t === 'combat.event' && msg.d) {
            const dmg = msg.d.dmg;
            const target = typeof msg.d.dst === 'string' ? parseInt(msg.d.dst, 10) : msg.d.dst;
            const src = typeof msg.d.src === 'string' ? parseInt(msg.d.src, 10) : msg.d.src;
            const isOwn = (src === window.__playerId);
            const targetName = getEntityName(target) || target;
            addLog(`Damage: ${dmg} to ${targetName} (ID: ${target})${isOwn ? ' (from you)' : ''}`, 'damage');
            if (window.__entityCache[target]) window.__entityCache[target].lastSeen = Date.now();
            // Own damage landing means the target is reachable - clears any
            // in-progress obstacle-dodge/return-to-center maneuver and
            // restarts the "haven't hit anything in a while" timer.
            if (isOwn && target === window.__currentTarget) {
                const wasManeuvering = window.__stuckState !== 'idle';
                window.__lastOwnDamageAt = Date.now();
                if (wasManeuvering) {
                    resetStuckState();
                    addLog(`Target ${target} reachable again - resuming normal attacking.`, 'info');
                }
            }
            return true;
        }
        // gather.action - repeating swing animation while working a node
        // (fires roughly every swingMs, e.g. 2500ms) - cache only, no log
        // line (would spam heavily, same reasoning as entity.move). Also
        // refreshes the node's lastSeen so pruneStaleEntities() doesn't drop
        // it from the Job tab mid-gather just because it hasn't been
        // re-sent via state.delta "add" recently.
        if (msg.t === 'gather.action' && msg.d) {
            window.__isGathering = true;
            if (msg.d.nodeId !== undefined) {
                const nodeId = typeof msg.d.nodeId === 'string' ? parseInt(msg.d.nodeId, 10) : msg.d.nodeId;
                window.__currentGatherNodeId = nodeId;
                const entry = window.__entityCache[nodeId];
                if (entry) entry.lastSeen = Date.now();
            }
            return true;
        }
        // gather.yield - resources + xp gained from one gather "tick"
        if (msg.t === 'gather.yield' && msg.d) {
            const items = Array.isArray(msg.d.items) ? msg.d.items : [];
            const itemsText = items.map(it => `${it.itemId} x${it.qty}`).join(', ') || 'nothing';
            addLog(`Gathered: ${itemsText}${msg.d.xp !== undefined ? ` (+${msg.d.xp} xp)` : ''}`, 'loot');
            return true;
        }
        // gather.end - gathering stopped (node depleted, out of range, or
        // cancelled). The node itself is removed separately via
        // state.delta's "rem" list.
        if (msg.t === 'gather.end' && msg.d) {
            addLog('Gathering finished.', 'info');
            window.__isGathering = false;
            window.__currentGatherNodeId = null;
            updateJobPanel();
            return true;
        }
        // profession.update - level/xp snapshot for gathering professions
        // (lumberjack, miner, ...). Shown in the Job tab.
        if (msg.t === 'profession.update' && msg.d && Array.isArray(msg.d.professions)) {
            window.__professions = msg.d.professions;
            updateJobPanel();
            return true;
        }
        // sys.notice - generic server notices; profession level-ups get a
        // nicer log line, everything else is just swallowed for now.
        if (msg.t === 'sys.notice' && msg.d) {
            if (msg.d.key === 'sys.profession.level_up' && msg.d.params) {
                addLog(`${msg.d.params.profession} leveled up to ${msg.d.params.level}!`, 'xp');
            }
            return true;
        }
        // state.delta - cache update
        if (msg.t === 'state.delta' && msg.d) {
            if (Array.isArray(msg.d.add)) {
                const adds = msg.d.add;
                const newMonsters = adds.filter(e => e.kind === 'monster');
                const newItems = adds.filter(e => e.kind === 'ground_item');
                const newNodes = adds.filter(e => e.kind === 'npc' && e.npcId);
                adds.forEach(e => cacheEntity(e));
                if (newMonsters.length) {
                    updateMonsterPanel();
                }
                if (newNodes.length) {
                    updateJobPanel();
                }
                if (newItems.length) {
                    addLog(`${newItems.length} new ground item(s):`, 'loot');
                    newItems.forEach(item => {
                        addLog(`  ${item.name} (ID: ${item.id}) at (${item.x?.toFixed(2)}, ${item.z?.toFixed(2)})`, 'loot');
                        enqueuePickup(item.id);
                    });
                }
            }
            // Removal list - confirmed (via captured node-depleted packets)
            // to actually be sent as "rem", not "remove". Kept "remove" as a
            // fallback in case a different server build uses that name.
            const removeIds = msg.d.rem || msg.d.remove;
            if (Array.isArray(removeIds)) {
                for (const id of removeIds) {
                    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                    delete window.__entityCache[numId];
                }
                updateMonsterPanel();
                updateJobPanel();
            }
            return true;
        }
        // quest.progress, progress.gainFx - hidden
        if (msg.t === 'quest.progress' || msg.t === 'progress.gainFx') {
            return true;
        }
        // entity.pickup
        if (msg.t === 'entity.pickup' && msg.d && msg.d.id) {
            const id = typeof msg.d.id === 'string' ? parseInt(msg.d.id, 10) : msg.d.id;
            if (id === window.__playerId) {
                addLog('Item picked up.', 'loot');
                onPickupSuccess();
            }
            return true;
        }
        // party.update - sent continuously while in a party (and stops once
        // you leave/get removed). Track it so the UI knows a party already
        // exists and create/register calls can be guarded accordingly.
        if (msg.t === 'party.update') {
            const d = msg.d || {};
            const wasInParty = !!window.__currentParty;
            window.__currentParty = d.partyId ? d : null;
            if (window.__currentParty && !wasInParty) {
                addLog(`Party joined/updated: ${d.partyId} (leader ${d.leaderCharId})`, 'info');
                window.__partyMemberCountFallback = 1; // just us (leader) so far
            } else if (!window.__currentParty && wasInParty) {
                addLog('Party left/disbanded.', 'info');
                window.__partyApplications = [];
                window.__partyMatchRegistered = false;
                window.__partyMemberCountFallback = 0;
                updatePartyApplicationsPanel();
            }
            updatePartyStatusPanel();
            evaluatePartyReform();
            return true;
        }
        // party.matchApplication - someone wants to join the registered party
        if (msg.t === 'party.matchApplication' && msg.d && msg.d.applicant) {
            const a = msg.d.applicant;
            if (window.__autoAcceptApplications) {
                if (!window.__autoAcceptAnyone && !isNameWhitelisted(a.name)) {
                    addLog(`Party application: ${a.name} - not on the auto-accept whitelist, leaving pending for manual review.`, 'info');
                } else {
                    const count = getPartyMemberCount();
                    const isFull = count !== null && count >= window.__partyMaxSize;
                    if (!isFull) {
                        const reason = window.__autoAcceptAnyone ? 'accept-anyone is on' : 'whitelisted';
                        addLog(`Party application: ${a.name} (level ${a.level}) - ${reason}, auto-accepting.`, 'info');
                        window.respondToPartyApplication(a.charId, true);
                        return true;
                    }
                    addLog(`Party application: ${a.name} - party looks full, leaving pending for manual review.`, 'info');
                }
            }
            if (!window.__partyApplications.some(app => app.charId === a.charId)) {
                window.__partyApplications.push(a);
            }
            addLog(`Party application: ${a.name} (level ${a.level}${a.race ? `, ${a.race}` : ''}) wants to join.`, 'info');
            updatePartyApplicationsPanel();
            return true;
        }
        // inv.update
        if (msg.t === 'inv.update' && msg.d) {
            const gold = msg.d.gold;
            if (gold !== undefined) {
                addLog(`Gold: ${gold}`, 'loot');
            }
            // Appears to be a full snapshot (gold/bag/equip) each time, not
            // a delta - just replace our copy outright.
            if (Array.isArray(msg.d.bag) || msg.d.equip) {
                window.__inventory = {
                    gold: gold !== undefined ? gold : window.__inventory.gold,
                    bag: Array.isArray(msg.d.bag) ? msg.d.bag : window.__inventory.bag,
                    equip: msg.d.equip || window.__inventory.equip
                };
                if (document.getElementById('sb-inventory-modal')) renderInventoryModalBody();
                // Fast path: confirm a pending gear swap the moment the
                // server reports it, instead of waiting for the next bot
                // tick to notice.
                resolvePendingWeaponSwapIfMatched();
            }
            return true;
        }
        return false;
    }
    // ============================================================
    //  9. BATCH SPLITTING
    // ============================================================
    function handleBatch(batchMsg) {
        const events = batchMsg.d;
        for (const ev of events) {
            logSpecial(ev);
        }
    }
    // ============================================================
    //  10. WEBSOCKET PATCH (unsafeWindow + connection status)
    // ============================================================
    function isOpen(ws) {
        return !!ws && ws.readyState === 1; // 1 = OPEN
    }
    // Appends to the packet ring buffer (only while debug is on). Kept
    // separate from the console.log calls so the log survives console
    // clears/scrollback limits and can be exported/copied on demand.
    function logPacket(dir, msg) {
        if (!window.__debugWS) return;
        window.__packetLog.push({ ts: Date.now(), dir, msg });
        if (window.__packetLog.length > window.__packetLogMax) {
            window.__packetLog.shift();
        }
    }
    function formatPacketLog() {
        return window.__packetLog.map(e => {
            const time = new Date(e.ts).toLocaleTimeString();
            let body;
            try { body = JSON.stringify(e.msg); } catch { body = String(e.msg); }
            return `[${time}] ${e.dir} ${body}`;
        }).join('\n');
    }
    function readyStateText(ws) {
        if (!ws) return 'no socket';
        switch (ws.readyState) {
            case 0: return 'CONNECTING';
            case 1: return 'OPEN';
            case 2: return 'CLOSING';
            case 3: return 'CLOSED';
            default: return '?';
        }
    }
    function patchWebSocket() {
        if (window.__isInitialized) {
            addLog('WebSocket already patched.', 'info');
            return;
        }
        const OrigWS = uw.WebSocket;
        if (!OrigWS) {
            addLog('Could not find the page WebSocket constructor.', 'error');
            return;
        }
        window.__OrigWS = OrigWS;

        function trackSocket(ws, source) {
            if (!ws || ws._sbTracked) return;
            ws._sbTracked = true;
            const info = { ws, url: ws.url, openedAt: null, closedAt: null };
            window.__wsList.push(info);
            addLog(`WebSocket detected (${source}): ${ws.url}`, 'info');

            ws.addEventListener('open', () => {
                info.openedAt = new Date();
                window.__ws = ws;
                addLog(`WebSocket connected: ${ws.url}`, 'info');
                updateStatus();
            });
            ws.addEventListener('close', (ev) => {
                info.closedAt = new Date();
                addLog(`WebSocket disconnected: ${ws.url} (code ${ev.code})`, 'error');
                updateStatus();
            });
            ws.addEventListener('error', () => {
                addLog(`WebSocket error: ${ws.url}`, 'error');
                updateStatus();
            });

            ws.addEventListener('message', e => {
                let msg;
                try { msg = JSON.parse(e.data); } catch {
                    if (window.__debugWS) { console.log('IN (raw)', e.data); logPacket('IN (raw)', e.data); }
                    return;
                }
                if (window.__debugWS) { console.log('IN', msg); logPacket('IN', msg); }
                if (!shouldHide(msg)) {
                    if (msg.t === 'batch' && Array.isArray(msg.d)) {
                        handleBatch(msg);
                    } else {
                        logSpecial(msg);
                    }
                }
            });

            if (isOpen(ws)) {
                info.openedAt = new Date();
                window.__ws = ws;
                addLog(`Adopted already-open WebSocket: ${ws.url}`, 'info');
            }
            updateStatus();
        }

        // Replace the constructor on the real page (unsafeWindow)
        uw.WebSocket = function(...args) {
            const ws = new OrigWS(...args);
            trackSocket(ws, 'constructor');
            return ws;
        };
        uw.WebSocket.prototype = OrigWS.prototype;
        Object.setPrototypeOf(uw.WebSocket, OrigWS);
        window.WebSocket = uw.WebSocket;

        // Patch send() on the shared native prototype
        const origProtoSend = OrigWS.prototype.send;
        OrigWS.prototype.send = function(data) {
            let msg;
            let isString = typeof data === 'string';

            try {
                msg = isString ? JSON.parse(data) : data;
            } catch {
                if (window.__debugWS) { console.log('OUT (raw)', data); logPacket('OUT (raw)', data); }
                return origProtoSend.call(this, data);
            }
            // Coerce targetId to a number for skill.cast
            if (msg && msg.t === 'skill.cast' && msg.d && msg.d.targetId !== undefined) {
                const numId = typeof msg.d.targetId === 'string' ? parseInt(msg.d.targetId, 10) : msg.d.targetId;
                if (!isNaN(numId)) {
                    msg.d.targetId = numId;
                    data = JSON.stringify(msg);
                }
            }
            if (window.__debugWS && msg) { console.log('OUT', msg); logPacket('OUT', msg); }
            return origProtoSend.call(this, data);
        };

        // Fallback scan in case the page already created its socket before
        // the patch ran, or holds it under a variable we don't know about.
        function scanForSockets(source) {
            try {
                for (const key in uw) {
                    try {
                        const val = uw[key];
                        if (val instanceof OrigWS) trackSocket(val, source);
                    } catch (e) {}
                }
            } catch (e) {}
            const paths = ['__ws', 'ws', 'socket', 'connection', '_socket'];
            for (const p of paths) {
                try {
                    const val = uw[p];
                    if (val instanceof OrigWS) trackSocket(val, source);
                } catch (e) {}
            }
        }
        window.__sbRescan = () => scanForSockets('manual-rescan');
        scanForSockets('initial-scan');
        setInterval(() => scanForSockets('periodic'), 2000);
        new MutationObserver(() => scanForSockets('mutation')).observe(document, { childList: true, subtree: true });

        window.__isInitialized = true;
        addLog('WebSocket patched (unsafeWindow).', 'info');
        updateStatus();
    }
    // ============================================================
    //  11. CONSOLE HELPERS
    // ============================================================
    window.__sendWS = function(obj) {
        if (!isOpen(window.__ws)) {
            addLog('WebSocket is not open.', 'error');
            return false;
        }
        window.__ws.send(JSON.stringify(obj));
        return true;
    };
    window.attack = function(targetId) {
        let id = targetId;
        if (!id) {
            const closest = findClosestMonster();
            if (!closest) {
                addLog('No monster found nearby.', 'error');
                return;
            }
            id = closest.id;
            window.__lastTargetId = id;
            addLog(`Closest monster: ${closest.name} (ID: ${id})`, 'monster-id');
        } else {
            id = typeof id === 'string' ? parseInt(id, 10) : id;
            window.__lastTargetId = id;
        }
        if (!window.__entityCache[id]) {
            addLog(`Target ID ${id} not in cache - looking for a new monster.`, 'error');
            const closest = findClosestMonster();
            if (!closest) {
                addLog('No monster found nearby.', 'error');
                return;
            }
            id = closest.id;
            window.__lastTargetId = id;
            addLog(`New target: ${closest.name} (ID: ${id})`, 'monster-id');
        }
        if (window.__currentTarget && window.__currentTarget !== id) {
            window.__currentTarget = id;
            window.__skillIndex = 0;
            window.__combatEngageAt = Date.now();
            resetStuckState();
            addLog(`New target ${id}, combat state reset.`, 'info');
        }
        if (!window.__currentTarget) {
            window.__currentTarget = id;
            window.__isFighting = true;
            window.__skillIndex = 0;
            window.__combatEngageAt = Date.now();
            resetStuckState();
            addLog(`Engaging target ${id}.`, 'info');
        }
        if (window.__activeSkills.length === 0) {
            // No skill configured - fall back to a plain attack instead of
            // failing.
            window.basicAttack(id);
            return;
        }
        // Round-robin through active skills, but skip any still on cooldown
        // (tracked via cast.ok's readyAt / ERR_COOLDOWN fallback - same
        // mechanism as the self-buffs, see canAttemptBuffCast) instead of
        // blindly sending skill.cast and eating an ERR_COOLDOWN every tick.
        const n = window.__activeSkills.length;
        let skill = null;
        for (let i = 0; i < n; i++) {
            const candidate = window.__activeSkills[(window.__skillIndex + i) % n];
            if (canAttemptBuffCast(candidate.base)) {
                skill = candidate;
                window.__skillIndex = (window.__skillIndex + i + 1) % n;
                break;
            }
        }
        if (!skill) {
            // Every active skill is still on cooldown - auto-attack in the
            // meantime instead of doing nothing this tick.
            window.basicAttack(id);
            return;
        }
        window.__buffLastCastAt[skill.base] = Date.now();
        const payload = {
            t: "skill.cast",
            d: {
                groupId: skill.base,
                targetId: id
            }
        };
        addLog(`Casting skill: ${skill.fullName} (${skill.base}, level ${skill.level}) on target ${id}`, 'info');
        window.__sendWS(payload);
        updateStatus();
    };
    // Plain attack without a skill. Confirmed packet format:
    // { t: "combat.attack", d: { id: targetId } }
    window.basicAttack = function(targetId) {
        let id = targetId;
        if (!id) {
            const closest = findClosestMonster();
            if (!closest) {
                addLog('No monster found nearby.', 'error');
                return;
            }
            id = closest.id;
            window.__lastTargetId = id;
            addLog(`Closest monster: ${closest.name} (ID: ${id})`, 'monster-id');
        } else {
            id = typeof id === 'string' ? parseInt(id, 10) : id;
            window.__lastTargetId = id;
        }
        if (window.__currentTarget !== id) {
            window.__currentTarget = id;
            window.__isFighting = true;
            window.__combatEngageAt = Date.now();
            resetStuckState();
            addLog(`Basic attack on ${id} started.`, 'info');
        }
        window.__sendWS({ t: "combat.attack", d: { id: id } });
        updateStatus();
    };
    window.moveTo = function(x, z) {
        window.__sendWS({ t: "move.click", d: { x, z } });
        addLog(`Moving to (${x?.toFixed(2)}, ${z?.toFixed(2)})`, 'info');
    };
    // Starts gathering a job node (tree, ore, ...). Confirmed packet format:
    // { t: "gather.start", d: { nodeId } }. Progress comes back as repeating
    // gather.action/gather.yield packets, and gather.end marks the finish
    // (node depleted or cancelled) - all handled in logSpecial().
    window.gatherNode = function(nodeId) {
        const id = typeof nodeId === 'string' ? parseInt(nodeId, 10) : nodeId;
        if (!id) {
            addLog('gatherNode: no node id given.', 'error');
            return;
        }
        if (!window.__entityCache[id] || window.__entityCache[id].kind !== 'npc') {
            addLog(`Node ${id} not found in cache - can't gather.`, 'error');
            return;
        }
        if (window.__isGathering) {
            addLog(`Already gathering node ${window.__currentGatherNodeId} - ignoring.`, 'info');
            return;
        }
        window.__currentGatherNodeId = id;
        window.__isGathering = true;
        window.__sendWS({ t: "gather.start", d: { nodeId: id } });
        const name = getEntityName(id) || id;
        addLog(`Gathering started on node ${id} (${name}).`, 'info');
        updateJobPanel();
    };
    // Manual one-off trigger, mainly for testing without starting the full
    // attack bot loop - the automatic version runs every bot loop tick (see
    // botLoopTick), same as self-buffs.
    window.buffPartyNow = function() {
        if (!window.__currentParty) {
            addLog('Not in a party.', 'error');
            return;
        }
        if (window.__partyBuffs.length === 0) {
            addLog('No party buffs configured (Party tab).', 'error');
            return;
        }
        maintainBuffs();
    };
    window.showTarget = function() {
        if (window.__lastTargetId) {
            const name = getEntityName(window.__lastTargetId) || 'Unknown';
            addLog(`Target ID: ${window.__lastTargetId} (${name})`, 'info');
        } else {
            addLog('No target captured yet.', 'error');
        }
    };
    window.addSkill = addSkill;
    window.removeSkill = removeSkill;
    window.showSkills = showSkills;
    window.addBuff = addBuff;
    window.removeBuff = removeBuff;
    window.showBuffs = showBuffs;
    window.addItemBuff = addItemBuff;
    window.removeItemBuff = removeItemBuff;
    window.getAvailableSkills = getAvailableSkills;
    window.getHighestTierSkills = getHighestTierSkills;
    window.showSkillsModal = showSkillsModal;
    window.clearMonsterCache = clearMonsterCache;
    window.pickup = function(itemId) {
        if (!itemId) {
            addLog('Provide an ID: pickup(123456)', 'error');
            return;
        }
        const numId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
        enqueuePickup(numId);
    };
    window.castSkill = function(fullName, targetId) {
        let id = targetId || window.__lastTargetId;
        if (!id) {
            addLog('No target ID.', 'error');
            return;
        }
        id = typeof id === 'string' ? parseInt(id, 10) : id;

        const { base, level } = extractSkillParts(fullName);
        if (level === 0) {
            addLog(`Skill "${fullName}" has no level suffix - cannot cast.`, 'error');
            return;
        }
        window.__sendWS({
            t: "skill.cast",
            d: { groupId: base, targetId: id }
        });
        addLog(`Cast ${fullName} on target ${id}`, 'info');
    };
    window.showCache = function() {
        addLog(`Entity cache (${Object.keys(window.__entityCache).length} entries):`, 'info');
        Object.entries(window.__entityCache).forEach(([id, data]) => {
            addLog(`  ${id}: ${data.name} (${data.kind}) at (${data.x?.toFixed(2)}, ${data.z?.toFixed(2)})`, 'info');
        });
    };
    window.showPickupQueue = function() {
        addLog(`Pickup queue (${window.__pickupQueue.length} item(s)):`, 'loot');
        window.__pickupQueue.forEach(id => {
            const name = getEntityName(id) || 'Unknown';
            addLog(`  ${id} (${name})`, 'loot');
        });
    };
    window.showWsStatus = function() {
        addLog(`WebSocket status (${window.__wsList.length} detected):`, 'info');
        window.__wsList.forEach((info, i) => {
            const state = readyStateText(info.ws);
            const isPrimary = info.ws === window.__ws ? ' [primary]' : '';
            addLog(`  #${i + 1} ${state} - ${info.url}${isPrimary}`, isOpen(info.ws) ? 'info' : 'error');
        });
        if (window.__wsList.length === 0) {
            addLog('  No socket detected yet. Try reloading the page or waiting for the connection.', 'error');
        }
    };
    // Packet debug: prints every raw IN/OUT packet to the browser console
    // (not to the GUI log, to avoid flooding it). Toggle at runtime.
    window.toggleDebug = function(state) {
        window.__debugWS = typeof state === 'boolean' ? state : !window.__debugWS;
        addLog(`Packet debug is now ${window.__debugWS ? 'ON' : 'OFF'} (see browser console for IN/OUT, or use exportPacketLog()/copyPacketLog())`, 'info');
        const btn = document.getElementById('sb-btn-debug');
        if (btn) {
            btn.textContent = `Debug: ${window.__debugWS ? 'ON' : 'OFF'}`;
            btn.classList.toggle('primary', window.__debugWS);
        }
        return window.__debugWS;
    };
    // Downloads the packet log as a .txt file (one IN/OUT packet per line).
    window.exportPacketLog = function() {
        if (window.__packetLog.length === 0) {
            addLog('Packet log is empty - enable Debug and let some packets happen first.', 'info');
            return;
        }
        const text = formatPacketLog();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sb-packet-log-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        addLog(`Exported ${window.__packetLog.length} packet(s) as a download.`, 'info');
    };
    // Copies the packet log to the clipboard as plain text.
    window.copyPacketLog = function() {
        if (window.__packetLog.length === 0) {
            addLog('Packet log is empty - enable Debug and let some packets happen first.', 'info');
            return;
        }
        const text = formatPacketLog();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                addLog(`Copied ${window.__packetLog.length} packet(s) to clipboard.`, 'info');
            }).catch(() => {
                addLog('Clipboard write failed - use exportPacketLog() instead.', 'error');
            });
        } else {
            addLog('Clipboard API unavailable here - use exportPacketLog() instead.', 'error');
        }
    };
    window.clearPacketLog = function() {
        window.__packetLog = [];
        addLog('Packet log cleared.', 'info');
    };
    // ============================================================
    //  11b. BOT LOOP (auto attack + loot until stopped)
    // ============================================================
    // ---- Leveling radius + "return to center" checkbox (localStorage) ----
    // Global, not per-character - it's a "how far should I roam" preference
    // tied to the account/session, not the specific character.
    const BOT_SETTINGS_STORAGE_KEY = 'sb_bot_leveling_settings';
    function loadBotSettings() {
        try {
            return JSON.parse(localStorage.getItem(BOT_SETTINGS_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }
    function saveBotSettings() {
        try {
            localStorage.setItem(BOT_SETTINGS_STORAGE_KEY, JSON.stringify({
                radius: window.__botRadius,
                returnToCenterOnStuck: window.__returnToCenterOnStuck
            }));
        } catch (e) {
            addLog('Could not save leveling settings to localStorage.', 'error');
        }
    }
    // ---- Stuck / obstacle handling ----
    // Fully resets the stuck state machine - called whenever a target is
    // freshly engaged (attack sees a new target), the target dies/goes
    // stale, or an obstacle maneuver actually worked again (own damage
    // landed). Also re-arms window.__lastOwnDamageAt to "now" so the
    // threshold timer restarts cleanly instead of immediately re-triggering
    // off a stale timestamp.
    function resetStuckState() {
        window.__stuckState = 'idle';
        window.__stuckProbeStep = 0;
        window.__stuckProbeStepStartedAt = null;
        window.__stuckReturnStartedAt = null;
        window.__lastOwnDamageAt = Date.now();
    }
    // Gives up on the current target (parks it on a cooldown so it isn't
    // immediately re-picked as "closest" again) and drops combat state so
    // the next tick's findClosestMonster() can pick a different, hopefully
    // reachable, monster.
    function abandonStuckTarget() {
        const id = window.__currentTarget;
        if (id) {
            window.__blockedUntil[id] = Date.now() + window.__blockedRetryMs;
            addLog(`Giving up on target ${id} for now (blocked ${Math.round(window.__blockedRetryMs / 1000)}s) - looking for another monster.`, 'error');
        }
        window.__currentTarget = null;
        window.__isFighting = false;
        window.__skillIndex = 0;
        resetStuckState();
        updateStatus();
    }
    // Computes three candidate waypoints around the player's current
    // position, relative to the direction toward the (presumably obstacle-
    // blocked) target: straight back, and off to either side. Used to
    // "walk around" whatever's blocking line of sight/attack range.
    function getStuckManeuverPoints() {
        const target = window.__entityCache[window.__currentTarget];
        if (!target || target.x === undefined || target.z === undefined) return null;
        const px = window.__playerPos.x, pz = window.__playerPos.z;
        const dx = target.x - px, dz = target.z - pz;
        const dist = Math.sqrt(dx * dx + dz * dz) || 1;
        const ux = dx / dist, uz = dz / dist; // unit vector: player -> target
        const backDist = 150, sideDist = 220;
        const back = { x: px - ux * backDist, z: pz - uz * backDist };
        // Perpendiculars to the player->target line, nudged slightly
        // forward so the side-step also advances toward the target instead
        // of just strafing in place.
        const left = { x: px - uz * sideDist + ux * backDist * 0.5, z: pz + ux * sideDist + uz * backDist * 0.5 };
        const right = { x: px + uz * sideDist + ux * backDist * 0.5, z: pz - ux * sideDist + uz * backDist * 0.5 };
        return { back, left, right };
    }
    function executeProbeStep() {
        const points = getStuckManeuverPoints();
        if (!points) {
            addLog(`Can't compute an obstacle-avoidance path (lost track of target ${window.__currentTarget}'s position) - dropping target.`, 'error');
            abandonStuckTarget();
            return;
        }
        const stepName = window.__stuckProbeSequence[window.__stuckProbeStep];
        const p = points[stepName];
        addLog(`Target ${window.__currentTarget} not taking damage - trying to walk around it (${stepName}).`, 'info');
        window.moveTo(p.x, p.z);
        window.__stuckProbeStepStartedAt = Date.now();
    }
    function startObstacleProbe() {
        window.__stuckState = 'probing';
        window.__stuckProbeStep = 0;
        executeProbeStep();
    }
    // Called every bot tick while probing. Lets each leg's walk play out
    // for __stuckProbeStepMs, then tries an attack from the new spot; if
    // the whole back/left/right sequence is exhausted without any damage
    // landing (own damage landing resets to 'idle' via combat.event), it
    // either falls back to recentering (if the checkbox is on) or abandons
    // this target for a new one.
    function continueObstacleProbe() {
        if (!window.__currentTarget || !window.__entityCache[window.__currentTarget]) {
            resetStuckState();
            return false;
        }
        const elapsed = Date.now() - window.__stuckProbeStepStartedAt;
        if (elapsed < window.__stuckProbeStepMs) return true; // still walking this leg
        window.attack();
        window.__stuckProbeStep++;
        if (window.__stuckProbeStep >= window.__stuckProbeSequence.length) {
            if (window.__returnToCenterOnStuck && window.__botCenter) {
                startReturnToCenter();
            } else {
                addLog(`Still can't hit target ${window.__currentTarget} after walking around it - dropping this target.`, 'error');
                abandonStuckTarget();
            }
            return true;
        }
        executeProbeStep();
        return true;
    }
    function startReturnToCenter() {
        const c = window.__botCenter;
        window.__stuckState = 'returning';
        window.__currentTarget = null;
        window.__isFighting = false;
        window.__skillIndex = 0;
        addLog(`Can't reach target - returning to the leveling center (${c.x.toFixed(1)}, ${c.z.toFixed(1)}).`, 'info');
        window.moveTo(c.x, c.z);
        window.__stuckReturnStartedAt = Date.now();
        updateStatus();
    }
    function continueReturnToCenter() {
        const elapsed = Date.now() - window.__stuckReturnStartedAt;
        if (elapsed < window.__stuckReturnTimeoutMs) return true; // still walking back
        addLog('Back near the leveling center - resuming normal attacking.', 'info');
        resetStuckState();
        return false; // let botLoopTick fall through to a normal attack() this same tick
    }
    // Entry point called from botLoopTick before every normal attack().
    // Returns true if it handled this tick itself (maneuvering) - caller
    // should skip the normal window.attack() call in that case.
    function checkStuckAndManeuver() {
        if (window.__stuckState === 'probing') return continueObstacleProbe();
        if (window.__stuckState === 'returning') return continueReturnToCenter();
        // idle: only relevant once we're actually engaged with a target
        if (!window.__isFighting || !window.__currentTarget) return false;
        const reference = window.__lastOwnDamageAt || window.__combatEngageAt;
        if (!reference) return false;
        const stuckMs = Date.now() - reference;
        if (stuckMs < window.__stuckThresholdMs) return false;
        addLog(`No damage landed on target ${window.__currentTarget} for ${Math.round(stuckMs / 1000)}s - likely blocked by an obstacle.`, 'error');
        if (window.__returnToCenterOnStuck && window.__botCenter) {
            startReturnToCenter();
        } else {
            startObstacleProbe();
        }
        return true;
    }
    function botLoopTick() {
        if (!window.__botLoopActive) return;
        if (!isOpen(window.__ws)) return;
        // Keep self-buffs, item buffs, and party buffs up regardless of
        // what else is happening this tick. Returns true while gear is
        // being swapped for a buff (or held in buff gear across several
        // ticks) - attacking during that window races with the pending
        // inv.move and silently breaks the swap, so we hold off until
        // maintainBuffs() reports it's done and back on normal gear.
        const buffsBusy = maintainBuffs();
        // Looting takes priority over attacking. Sending an attack while a
        // pickup is in flight appears to redirect the player's movement
        // away from the loot item, so the pickup never actually completes.
        // Skip attacking entirely until the queue is empty and no pickup is
        // in progress.
        if (window.__pickupQueue.length > 0 || window.__isPickingUp) {
            if (!window.__isPickingUp) {
                processPickupQueue();
            }
            return;
        }
        if (buffsBusy) return;
        if (checkStuckAndManeuver()) return;
        window.attack();
    }
    function updateBotLoopButton() {
        const btn = document.getElementById('sb-btn-toggle-bot');
        if (!btn) return;
        btn.textContent = window.__botLoopActive ? 'Stop Bot' : 'Start Bot';
        btn.classList.toggle('active', window.__botLoopActive);
    }
    function updateLevelingStatusLine() {
        const el = document.getElementById('sb-status-leveling');
        if (!el) return;
        if (!window.__botCenter) {
            el.textContent = 'Leveling area: not set (starts fresh from wherever Start Bot is pressed).';
            return;
        }
        const c = window.__botCenter;
        const radiusText = window.__botRadius > 0 ? `radius ${window.__botRadius}` : 'no radius limit';
        const stuckText = window.__stuckState !== 'idle' ? `, ${window.__stuckState === 'probing' ? 'dodging obstacle' : 'returning to center'}` : '';
        el.textContent = `Leveling area: (${c.x.toFixed(1)}, ${c.z.toFixed(1)}), ${radiusText}${stuckText}`;
    }
    window.startBot = function() {
        if (window.__botLoopActive) {
            addLog('Bot loop is already running.', 'info');
            return;
        }
        const radiusInput = document.getElementById('sb-radius-input');
        const parsedRadius = radiusInput ? parseFloat(radiusInput.value) : NaN;
        window.__botRadius = (!isNaN(parsedRadius) && parsedRadius > 0) ? parsedRadius : 0;
        const returnCheckbox = document.getElementById('sb-return-center-checkbox');
        window.__returnToCenterOnStuck = returnCheckbox ? !!returnCheckbox.checked : window.__returnToCenterOnStuck;
        saveBotSettings();
        // Center is always captured fresh from the current position - "here
        // is where I want to level" is exactly where the button was pressed.
        window.__botCenter = { x: window.__playerPos.x, z: window.__playerPos.z };
        window.__blockedUntil = {};
        resetStuckState();
        window.__botLoopActive = true;
        const radiusMsg = window.__botRadius > 0 ? `within a ${window.__botRadius} radius of (${window.__botCenter.x.toFixed(1)}, ${window.__botCenter.z.toFixed(1)})` : 'with no radius limit';
        addLog(`Bot loop started (interval ${window.__botLoopIntervalMs}ms). Leveling ${radiusMsg}. Attacks the current or nearest target in range and loots automatically.`, 'info');
        updateBotLoopButton();
        updateLevelingStatusLine();
        window.__botLoopTimer = setInterval(botLoopTick, window.__botLoopIntervalMs);
        botLoopTick();
    };
    window.stopBot = function() {
        window.__botLoopActive = false;
        if (window.__botLoopTimer) {
            clearInterval(window.__botLoopTimer);
            window.__botLoopTimer = null;
        }
        resetStuckState();
        addLog('Bot loop stopped.', 'info');
        updateBotLoopButton();
    };
    window.toggleBot = function() {
        if (window.__botLoopActive) {
            window.stopBot();
        } else {
            window.startBot();
        }
    };
    // ============================================================
    //  11c. PARTY MANAGEMENT
    // ============================================================
    // Confirmed packet formats:
    //   OUT  { t: "party.create", d: { expShare, itemShare } }
    //        both false -> regular 4-person party (server default)
    //   OUT  { t: "party.match", d: { op: "register", title, raceReq, minLevel, maxLevel } }
    //        makes the party visible in the party finder
    //   IN   { t: "party.matchApplication", d: { applicant: { charId, name, level, race, expiresAt } } }
    //   OUT  { t: "party.match", d: { op: "applyRespond", applicantCharId, accept } }
    //   IN   { t: "party.update", d: { partyId, leaderCharId, expShare, itemShare, ... } }
    //        received continuously while in a party; you cannot create or
    //        reconfigure a party while one of these is active - leave first.
    //   OUT  { t: "party.leave", d: {} }
    window.createParty = function(expShare, itemShare) {
        if (window.__currentParty) {
            addLog('Already in a party - leave it first with leaveParty() before creating a new one.', 'error');
            return;
        }
        window.__sendWS({ t: "party.create", d: { expShare: !!expShare, itemShare: !!itemShare } });
        addLog(`Party create requested (expShare: ${!!expShare}, itemShare: ${!!itemShare}).`, 'info');
    };
    window.leaveParty = function() {
        if (!window.__currentParty) {
            addLog('Not currently in a party.', 'info');
            return;
        }
        window.__sendWS({ t: "party.leave", d: {} });
        addLog('Leaving party...', 'info');
        // Optimistic clear - the server doesn't seem to send a dedicated
        // "left" event, just stops sending party.update for this party.
        window.__currentParty = null;
        window.__partyApplications = [];
        window.__partyMatchRegistered = false;
        window.__partyMemberCountFallback = 0;
        updatePartyApplicationsPanel();
        updatePartyStatusPanel();
    };
    window.registerPartyMatch = function(title, opts = {}) {
        if (!window.__currentParty) {
            addLog('You need to be in a party before registering it for matching.', 'error');
            return;
        }
        const cleanTitle = (title || '').trim();
        if (!cleanTitle) {
            addLog('Party title is required to register for matching.', 'error');
            return;
        }
        const resolvedOpts = {
            raceReq: opts.raceReq || "both",
            minLevel: opts.minLevel ?? 1,
            maxLevel: opts.maxLevel ?? 80
        };
        const payload = {
            t: "party.match",
            d: { op: "register", title: cleanTitle, ...resolvedOpts }
        };
        window.__sendWS(payload);
        window.__partyMatchRegistered = true;
        window.__lastPartyMatchTitle = cleanTitle;
        window.__lastPartyMatchOpts = resolvedOpts;
        addLog(`Party registered for matching: "${cleanTitle}"`, 'info');
    };
    window.respondToPartyApplication = function(applicantCharId, accept) {
        window.__sendWS({ t: "party.match", d: { op: "applyRespond", applicantCharId, accept: !!accept } });
        window.__partyApplications = window.__partyApplications.filter(a => a.charId !== applicantCharId);
        if (accept) {
            // Best-effort bump; corrected on the next party.update if that
            // packet turns out to carry a real member list (see
            // getPartyMemberCount).
            window.__partyMemberCountFallback++;
        }
        addLog(`Party application ${accept ? 'accepted' : 'rejected'}: ${applicantCharId}`, 'info');
        updatePartyApplicationsPanel();
        evaluatePartyReform();
    };
    // Best-effort party size. Tries a few plausible field names for a
    // member list on the party.update payload first (unconfirmed - none of
    // the party.update samples seen so far included one); falls back to our
    // own bookkeeping (leader + accepted applications) if none match, which
    // can't detect someone leaving on its own. If auto-reform doesn't
    // trigger when a member leaves, capture a party.update packet with 2+
    // members (Export/Copy Packet Log) so the real field can be wired in.
    function getPartyMemberCount() {
        const p = window.__currentParty;
        if (!p) return null;
        const memberArr = p.members || p.memberIds || p.memberCharIds || p.partyMembers;
        if (Array.isArray(memberArr)) return memberArr.length;
        if (typeof p.memberCount === 'number') return p.memberCount;
        if (typeof p.size === 'number') return p.size;
        return window.__partyMemberCountFallback;
    }
    // Runs whenever party membership might have changed. Full party ->
    // treat matchmaking registration as closed (assumes the server drops it
    // automatically once full - we just stop believing we're registered).
    // Open slot + auto-reform on + we're the leader + we have a previous
    // title -> register again automatically.
    function evaluatePartyReform() {
        if (!window.__currentParty) return;
        const count = getPartyMemberCount();
        if (count === null) return;
        const isFull = count >= window.__partyMaxSize;
        const isLeader = !!(window.__charId && window.__currentParty.leaderCharId === window.__charId);
        if (isFull) {
            if (window.__partyMatchRegistered) {
                window.__partyMatchRegistered = false;
                addLog(`Party full (${count}/${window.__partyMaxSize}) - matchmaking considered closed.`, 'info');
            }
            return;
        }
        if (window.__autoReformParty && isLeader && !window.__partyMatchRegistered && window.__lastPartyMatchTitle) {
            addLog(`Party has an open slot (${count}/${window.__partyMaxSize}) - re-registering for matching.`, 'info');
            window.registerPartyMatch(window.__lastPartyMatchTitle, window.__lastPartyMatchOpts || {});
        }
    }
    function updatePartyApplicationsPanel() {
        const el = document.getElementById('sb-party-applications');
        if (!el) return;
        if (window.__partyApplications.length === 0) {
            el.innerHTML = `<div class="panel-party-apps-empty">No pending applications.</div>`;
            return;
        }
        el.innerHTML = window.__partyApplications.map(a => `
            <div class="panel-party-app-row">
                <span class="panel-party-app-name">${a.name} (Lv.${a.level}${a.race ? `, ${a.race}` : ''})</span>
                <span class="panel-party-app-btns">
                    <button class="accept" data-char="${a.charId}" data-accept="1">Accept</button>
                    <button class="reject" data-char="${a.charId}" data-accept="0">Reject</button>
                </span>
            </div>
        `).join('');
        el.querySelectorAll('.panel-party-app-btns button').forEach(btn => {
            btn.addEventListener('click', () => {
                window.respondToPartyApplication(btn.getAttribute('data-char'), btn.getAttribute('data-accept') === '1');
            });
        });
    }
    function updatePartyWhitelistPanel() {
        const el = document.getElementById('sb-party-whitelist-list');
        if (!el) return;
        if (window.__partyAutoAcceptWhitelist.length === 0) {
            el.innerHTML = window.__autoAcceptAnyone
                ? `<div class="panel-party-apps-empty">No names whitelisted, but "Accept anyone" is on - everyone gets auto-accepted.</div>`
                : `<div class="panel-party-apps-empty">No names whitelisted - Auto-accept won't accept anyone unless "Accept anyone" is checked.</div>`;
            return;
        }
        el.innerHTML = window.__partyAutoAcceptWhitelist.map(name => `
            <div class="panel-party-app-row">
                <span class="panel-party-app-name">${name}</span>
                <span class="panel-party-app-btns">
                    <button class="reject" data-name="${name}">Remove</button>
                </span>
            </div>
        `).join('');
        el.querySelectorAll('.panel-party-app-btns button').forEach(btn => {
            btn.addEventListener('click', () => window.removeFromPartyWhitelist(btn.getAttribute('data-name')));
        });
    }
    function updateWeaponSettingsPanel() {
        const pending = window.__weaponSwapPending;
        const pendingSuffix = pending ? ` (switching to ${pending.direction === 'toBuff' ? 'buff' : 'primary'} gear...)` : '';
        const primaryEl = document.getElementById('sb-primarygear-status');
        if (primaryEl) {
            if (!window.__primaryWeaponItemId) {
                primaryEl.textContent = 'No primary weapon configured.';
                primaryEl.className = 'panel-status-line';
            } else {
                primaryEl.textContent = `Primary weapon: ${window.__primaryWeaponItemId}${window.__primaryShieldItemId ? `, shield: ${window.__primaryShieldItemId}` : ''}${!window.__weaponSwappedToBuffGear ? ' (currently equipped)' : ''}${pendingSuffix}`;
                primaryEl.className = 'panel-status-line status-ok';
            }
        }
        const buffEl = document.getElementById('sb-buffgear-status');
        if (buffEl) {
            if (!window.__buffWeaponItemId) {
                buffEl.textContent = 'No buff weapon configured.';
                buffEl.className = 'panel-status-line';
            } else {
                buffEl.textContent = `Buff weapon: ${window.__buffWeaponItemId}${window.__buffShieldItemId ? `, shield: ${window.__buffShieldItemId}` : ''}${window.__weaponSwappedToBuffGear ? ' (currently equipped)' : ''}${pendingSuffix}`;
                buffEl.className = 'panel-status-line status-ok';
            }
        }
    }
    function updatePartyBuffsPanel() {
        const el = document.getElementById('sb-partybuffs-list');
        if (!el) return;
        if (window.__partyBuffs.length === 0) {
            el.innerHTML = `<div class="panel-list-empty">No party buffs configured.</div>`;
            return;
        }
        el.innerHTML = window.__partyBuffs.map(b => `
            <div class="panel-skill-row">
                <span class="panel-skill-name" title="${b.fullName}">${skillLabel(b.fullName)}</span>
                <label style="display:flex;align-items:center;gap:3px;flex-shrink:0;color:#999;">
                    <input type="checkbox" class="partybuff-swap-toggle" data-buff="${b.fullName}" ${b.needsWeaponSwap ? 'checked' : ''} /> swap
                </label>
                <button class="panel-skill-remove-btn" data-buff="${b.fullName}">Remove</button>
            </div>
        `).join('');
        el.querySelectorAll('.partybuff-swap-toggle').forEach(cb => {
            cb.addEventListener('change', (e) => {
                window.setPartyBuffNeedsSwap(cb.getAttribute('data-buff'), e.target.checked);
            });
        });
        el.querySelectorAll('.panel-skill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => window.removePartyBuff(btn.getAttribute('data-buff')));
        });
    }
    // Reflects window.__currentParty in the GUI: status line, and the
    // create button flips into a "Leave Party" button while one is active
    // (the server refuses party.create/party.match register while you're
    // already in a party).
    function updatePartyStatusPanel() {
        const statusEl = document.getElementById('sb-party-status');
        const btn = document.getElementById('sb-btn-party-create');
        const expEl = document.getElementById('sb-party-expshare');
        const itemEl = document.getElementById('sb-party-itemshare');
        const p = window.__currentParty;
        const inParty = !!p;
        if (statusEl) {
            if (inParty) {
                const isLeader = window.__charId && p.leaderCharId === window.__charId;
                const count = getPartyMemberCount();
                const sizeText = count !== null ? `${count}/${window.__partyMaxSize}` : '?';
                const regText = window.__partyMatchRegistered ? 'registered' : 'not registered';
                statusEl.textContent = `In party (${isLeader ? 'leader' : 'member'}, ${sizeText}) - expShare: ${!!p.expShare}, itemShare: ${!!p.itemShare}, ${regText}`;
                statusEl.className = 'panel-status-line status-ok';
            } else {
                statusEl.textContent = 'Not in a party.';
                statusEl.className = 'panel-status-line';
            }
        }
        if (btn) {
            btn.textContent = inParty ? 'Leave Party' : 'Create Party';
            btn.classList.toggle('danger', inParty);
            btn.classList.toggle('primary', !inParty);
        }
        if (expEl) {
            expEl.disabled = inParty;
            if (inParty) expEl.checked = !!p.expShare;
        }
        if (itemEl) {
            itemEl.disabled = inParty;
            if (inParty) itemEl.checked = !!p.itemShare;
        }
    }
    // Renders the active buffs + remaining time under the Buff input row.
    // Renders the active buff list (Skills tab) with live countdowns and a
    // Remove button per row.
    function updateBuffStatusPanel() {
        const el = document.getElementById('sb-active-buffs-list');
        if (!el) return;
        if (window.__activeBuffs.length === 0) {
            el.innerHTML = `<div class="panel-list-empty">No active buffs.</div>`;
            return;
        }
        const now = Date.now();
        el.innerHTML = window.__activeBuffs.map(b => {
            const exp = window.__buffExpiry[b.base];
            const remain = exp ? `${Math.max(0, Math.round((exp - now) / 1000))}s` : 'inactive';
            return `
                <div class="panel-skill-row">
                    <span class="panel-skill-name" title="${b.fullName}">${skillLabel(b.fullName)} <span class="panel-skill-timer">(${remain})</span></span>
                    <label style="display:flex;align-items:center;gap:3px;flex-shrink:0;color:#999;">
                        <input type="checkbox" class="buff-swap-toggle" data-buff="${b.fullName}" ${b.needsWeaponSwap ? 'checked' : ''} /> swap
                    </label>
                    <button class="panel-skill-remove-btn" data-buff="${b.fullName}">Remove</button>
                </div>
            `;
        }).join('');
        el.querySelectorAll('.buff-swap-toggle').forEach(cb => {
            cb.addEventListener('change', (e) => {
                window.setBuffNeedsSwap(cb.getAttribute('data-buff'), e.target.checked);
            });
        });
        el.querySelectorAll('.panel-skill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => window.removeBuff(btn.getAttribute('data-buff')));
        });
    }
    // Renders the active (combat rotation) skill list (Skills tab) with a
    // Remove button per row.
    function updateActiveSkillsPanel() {
        const el = document.getElementById('sb-active-skills-list');
        if (!el) return;
        if (window.__activeSkills.length === 0) {
            el.innerHTML = `<div class="panel-list-empty">No active skills.</div>`;
            return;
        }
        el.innerHTML = window.__activeSkills.map(s => `
            <div class="panel-skill-row">
                <span class="panel-skill-name" title="${s.fullName}">${skillLabel(s.fullName)}</span>
                <button class="panel-skill-remove-btn" data-skill="${s.fullName}">Remove</button>
            </div>
        `).join('');
        el.querySelectorAll('.panel-skill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => window.removeSkill(btn.getAttribute('data-skill')));
        });
    }
    // Renders the active item-buff list (Skills tab) with live countdowns
    // and a Remove button per row.
    function updateItemBuffsPanel() {
        const el = document.getElementById('sb-active-itembuffs-list');
        if (!el) return;
        if (window.__activeItemBuffs.length === 0) {
            el.innerHTML = `<div class="panel-list-empty">No active item buffs.</div>`;
            return;
        }
        const now = Date.now();
        el.innerHTML = window.__activeItemBuffs.map(i => {
            const exp = window.__buffExpiry[itemBuffGroupId(i.itemId)];
            const remain = exp ? `${Math.max(0, Math.round((exp - now) / 1000))}s` : 'inactive';
            const inStock = findBagSlotForItem(i.itemId) !== null;
            return `
                <div class="panel-skill-row">
                    <span class="panel-skill-name">${i.itemId} <span class="panel-skill-timer">(${remain}${inStock ? '' : ', out of stock'})</span></span>
                    <button class="panel-skill-remove-btn" data-item="${i.itemId}">Remove</button>
                </div>
            `;
        }).join('');
        el.querySelectorAll('.panel-skill-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => window.removeItemBuff(btn.getAttribute('data-item')));
        });
    }
    // ============================================================
    //  12. STATUS UPDATE
    // ============================================================
    function updateStatus() {
        const statusElement = document.getElementById('sb-status');
        const wsStatusElement = document.getElementById('sb-status-ws');
        if (!statusElement) return;
        const targetId = window.__currentTarget || window.__lastTargetId || 'none';
        const targetName = targetId !== 'none' ? getEntityName(targetId) || '' : '';
        const skills = window.__activeSkills.length;
        const queue = window.__pickupQueue.length;
        const ws = window.__ws;
        const connected = isOpen(ws);
        statusElement.innerHTML = `
            <span>Target: ${targetId} ${targetName}</span>
            <span>${window.__isFighting ? 'In combat' : 'Idle'}</span>
            <span>${skills} skill(s)</span>
            <span>${queue} item(s) queued</span>
            <span class="${connected ? 'status-ok' : 'status-error'}">
                ${connected ? 'Connected' : 'Disconnected'}
            </span>
        `;
        if (wsStatusElement) {
            const total = window.__wsList.length;
            if (!ws) {
                wsStatusElement.className = 'panel-status-line status-error';
                wsStatusElement.textContent = total > 0
                    ? `${total} socket(s) detected, none open yet`
                    : 'No WebSocket detected yet...';
            } else {
                wsStatusElement.className = `panel-status-line ${connected ? 'status-ok' : 'status-error'}`;
                wsStatusElement.textContent = `${readyStateText(ws)} - ${ws.url} (${total} socket(s) detected)`;
                wsStatusElement.title = ws.url;
            }
        }
        updateBuffStatusPanel();
        updateActiveSkillsPanel();
        updateItemBuffsPanel();
        updateLevelingStatusLine();
    }
    // ============================================================
    //  13. MAIN PANEL
    // ============================================================
    function createPanel() {
        if (document.getElementById('sb-helper-panel')) {
            document.getElementById('sb-helper-panel').style.display = 'flex';
            return;
        }
        const panel = document.createElement('div');
        panel.id = 'sb-helper-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <span class="panel-title">Silkroad Bot Helper</span>
                <span class="panel-close" id="sb-panel-close">&times;</span>
            </div>
            <div class="panel-tabs">
                <button class="panel-tab-btn active" data-tab="skills">Skills</button>
                <button class="panel-tab-btn" data-tab="party">Party</button>
                <button class="panel-tab-btn" data-tab="weapon">Weapon</button>
                <button class="panel-tab-btn" data-tab="job">Job</button>
                <button class="panel-tab-btn" data-tab="debug">Debug</button>
            </div>
            <div class="panel-tab-content active" data-tab-content="skills">
                <div class="panel-buttons">
                    <button id="sb-btn-available-skills">Available Skills</button>
                    <button id="sb-btn-inventory">Inventory</button>
                </div>
                <div class="panel-section-title">Active Skills</div>
                <div class="panel-skill-list" id="sb-active-skills-list">
                    <div class="panel-list-empty">No active skills.</div>
                </div>
                <div class="panel-section-title">Active Buffs</div>
                <div class="panel-skill-list" id="sb-active-buffs-list">
                    <div class="panel-list-empty">No active buffs.</div>
                </div>
                <div class="panel-section-title">Active Item Buffs</div>
                <div class="panel-skill-list" id="sb-active-itembuffs-list">
                    <div class="panel-list-empty">No active item buffs.</div>
                </div>
            </div>
            <div class="panel-tab-content" data-tab-content="party">
                <div class="panel-status-line" id="sb-party-status">Not in a party.</div>
                <div class="panel-checkbox-row">
                    <label><input type="checkbox" id="sb-party-expshare" /> Exp Share</label>
                    <label><input type="checkbox" id="sb-party-itemshare" /> Item Share</label>
                    <button class="primary" id="sb-btn-party-create">Create Party</button>
                </div>
                <div class="panel-input-row">
                    <label>Title</label>
                    <input type="text" id="sb-party-title-input" placeholder="THIS IS MY PARTY" />
                    <button id="sb-btn-party-register">Register</button>
                </div>
                <div class="panel-checkbox-row">
                    <label><input type="checkbox" id="sb-party-autoaccept" /> Auto-accept</label>
                    <label><input type="checkbox" id="sb-party-autoreform" /> Auto-reform</label>
                </div>
                <div class="panel-checkbox-row">
                    <label><input type="checkbox" id="sb-party-autoaccept-anyone" /> Accept anyone (ignore whitelist)</label>
                </div>
                <div class="panel-section-title">Auto-accept Whitelist</div>
                <div class="panel-input-row">
                    <input type="text" id="sb-party-whitelist-input" placeholder="Character name" />
                    <button id="sb-btn-party-whitelist-add">Add</button>
                </div>
                <div class="panel-party-apps" id="sb-party-whitelist-list">
                    <div class="panel-party-apps-empty">No names whitelisted - Auto-accept won't accept anyone unless "Accept anyone" is checked above.</div>
                </div>
                <div class="panel-section-title">Applications</div>
                <div class="panel-party-apps" id="sb-party-applications">
                    <div class="panel-party-apps-empty">No pending applications.</div>
                </div>
                <div class="panel-section-title">Party Buffs (cast on other party members only - see Weapon tab for gear)</div>
                <div class="panel-skill-list" id="sb-partybuffs-list">
                    <div class="panel-list-empty">No party buffs configured.</div>
                </div>
                <div class="panel-buttons">
                    <button id="sb-btn-partybuff-choose">Choose from Available Skills...</button>
                    <button id="sb-btn-buffparty-now">Buff Party Now</button>
                </div>
            </div>
            <div class="panel-tab-content" data-tab-content="weapon">
                <div class="panel-section-title">Primary Gear (what you normally fight with)</div>
                <div class="panel-status-line" id="sb-primarygear-status">No primary weapon configured.</div>
                <div class="panel-buttons">
                    <button id="sb-btn-primarygear-choose">Choose from Inventory...</button>
                </div>
                <div class="panel-section-title">Buff Gear (equipped only while casting weapon-swap buffs)</div>
                <div class="panel-status-line" id="sb-buffgear-status">No buff weapon configured.</div>
                <div class="panel-buttons">
                    <button id="sb-btn-buffgear-choose">Choose from Inventory...</button>
                </div>
                <div class="panel-status-line" style="color:#666;margin-top:6px;">
                    Mark a skill as needing this swap in the Skills tab (self-buffs) or here in Party Buffs. Some buffs cancel themselves the moment you switch weapons again - only enable the swap for buffs you've confirmed survive it.
                </div>
            </div>
            <div class="panel-tab-content" data-tab-content="job">
                <div class="panel-status-line" id="sb-job-profession">No profession data yet.</div>
                <div class="job-count" id="sb-job-count">0 node(s) nearby</div>
                <div class="job-table-wrap">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Name</th><th>Grade</th><th>Job</th><th>Dist</th><th></th></tr>
                        </thead>
                        <tbody id="sb-job-table-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="panel-tab-content" data-tab-content="debug">
                <div class="panel-buttons">
                    <button id="sb-btn-attack">Attack</button>
                    <button id="sb-btn-basic-attack">Basic Attack</button>
                    <button id="sb-btn-loot">Loot</button>
                </div>
                <div class="panel-input-row">
                    <label>Move</label>
                    <input type="text" id="sb-move-input" placeholder="x, z (e.g. -16800, 3600)" />
                    <button id="sb-btn-move">Go</button>
                </div>
                <div class="panel-input-row">
                    <label>Skill</label>
                    <input type="text" id="sb-skill-input" placeholder="skill_name_2" />
                    <button id="sb-btn-add-skill">Add</button>
                    <button id="sb-btn-remove-skill">Remove</button>
                </div>
                <div class="panel-input-row">
                    <label>Buff</label>
                    <input type="text" id="sb-buff-input" placeholder="skill_name_2" />
                    <button id="sb-btn-add-buff">Add</button>
                    <button id="sb-btn-remove-buff">Remove</button>
                </div>
                <div class="panel-input-row">
                    <label>Item</label>
                    <input type="text" id="sb-itembuff-input" placeholder="speed_potion_01" />
                    <button id="sb-btn-add-itembuff">Add</button>
                    <button id="sb-btn-remove-itembuff">Remove</button>
                </div>
                <div class="panel-buttons">
                    <button id="sb-btn-reconnect">Rescan WS</button>
                    <button id="sb-btn-debug">Debug: OFF</button>
                    <button id="sb-btn-export-log">Export Packet Log</button>
                    <button id="sb-btn-copy-log">Copy Packet Log</button>
                    <button id="sb-btn-clear-packet-log">Clear Packet Log</button>
                </div>
                <div class="panel-status-line" id="sb-status-ws">Looking for a WebSocket...</div>
            </div>
            <div class="panel-section-title">Leveling Area (set on Start Bot)</div>
            <div class="panel-input-row">
                <label>Radius</label>
                <input type="number" id="sb-radius-input" placeholder="0 = unlimited" min="0" step="50" />
            </div>
            <div class="panel-checkbox-row">
                <label><input type="checkbox" id="sb-return-center-checkbox" /> If stuck too long, return to center instead of dodging</label>
            </div>
            <div class="panel-status-line" id="sb-status-leveling">Leveling area: not set (starts fresh from wherever Start Bot is pressed).</div>
            <div class="panel-buttons">
                <button class="primary" id="sb-btn-toggle-bot">Start Bot</button>
                <button id="sb-btn-clear">Clear Log</button>
                <button class="danger" id="sb-btn-panel-hide">Hide</button>
            </div>
            <div class="panel-log" id="sb-log-content"></div>
            <div class="panel-status" id="sb-status">
                <span>Initializing...</span>
            </div>
            <div class="panel-status-line" id="sb-status-vitals">Vitals: waiting for data...</div>
        `;
        document.body.appendChild(panel);

        document.getElementById('sb-panel-close').addEventListener('click', () => {
            panel.style.display = 'none';
        });
        panel.querySelectorAll('.panel-tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const target = tabBtn.getAttribute('data-tab');
                panel.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.toggle('active', b === tabBtn));
                panel.querySelectorAll('.panel-tab-content').forEach(c => {
                    c.classList.toggle('active', c.getAttribute('data-tab-content') === target);
                });
            });
        });
        document.getElementById('sb-btn-toggle-bot').addEventListener('click', () => {
            window.toggleBot();
        });
        document.getElementById('sb-radius-input').addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            window.__botRadius = (!isNaN(val) && val > 0) ? val : 0;
            saveBotSettings();
            updateLevelingStatusLine();
        });
        document.getElementById('sb-return-center-checkbox').addEventListener('change', (e) => {
            window.__returnToCenterOnStuck = e.target.checked;
            saveBotSettings();
            addLog(`Return-to-center on stuck: ${window.__returnToCenterOnStuck ? 'ON' : 'OFF'}`, 'info');
        });
        document.getElementById('sb-btn-attack').addEventListener('click', () => {
            window.attack();
        });
        document.getElementById('sb-btn-basic-attack').addEventListener('click', () => {
            window.basicAttack();
        });
        document.getElementById('sb-btn-loot').addEventListener('click', () => {
            if (window.__pickupQueue.length > 0) {
                addLog('Starting loot queue...', 'loot');
                processPickupQueue();
            } else {
                addLog('No items in the queue.', 'info');
            }
        });
        document.getElementById('sb-btn-available-skills').addEventListener('click', () => {
            getAvailableSkills();
        });
        document.getElementById('sb-btn-inventory').addEventListener('click', () => {
            showInventoryModal();
        });
        document.getElementById('sb-btn-clear').addEventListener('click', () => {
            window.__logEntries = [];
            updateLogDisplay();
        });
        document.getElementById('sb-btn-reconnect').addEventListener('click', () => {
            addLog('Rescanning for WebSockets...', 'info');
            if (!window.__isInitialized) {
                patchWebSocket();
            } else if (window.__sbRescan) {
                window.__sbRescan();
            }
            updateStatus();
        });
        document.getElementById('sb-btn-debug').addEventListener('click', () => {
            window.toggleDebug();
        });
        document.getElementById('sb-btn-export-log').addEventListener('click', () => {
            window.exportPacketLog();
        });
        document.getElementById('sb-btn-copy-log').addEventListener('click', () => {
            window.copyPacketLog();
        });
        document.getElementById('sb-btn-clear-packet-log').addEventListener('click', () => {
            window.clearPacketLog();
        });
        document.getElementById('sb-btn-panel-hide').addEventListener('click', () => {
            panel.style.display = 'none';
            const showBtn = document.getElementById('sb-show-panel-btn') || document.createElement('button');
            showBtn.id = 'sb-show-panel-btn';
            showBtn.textContent = 'Show Bot Panel';
            showBtn.style.display = 'block';
            if (!showBtn.isConnected) {
                showBtn.addEventListener('click', () => {
                    panel.style.display = 'flex';
                    showBtn.style.display = 'none';
                });
                document.body.appendChild(showBtn);
            }
        });
        document.getElementById('sb-btn-move').addEventListener('click', () => {
            const input = document.getElementById('sb-move-input');
            const parts = input.value.split(',').map(s => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                window.moveTo(parts[0], parts[1]);
            } else {
                addLog('Invalid coordinates. Format: x, z (e.g. -16800, 3600)', 'error');
            }
        });
        document.getElementById('sb-btn-add-skill').addEventListener('click', () => {
            const input = document.getElementById('sb-skill-input');
            const skill = input.value.trim();
            if (skill) {
                window.addSkill(skill);
                input.value = '';
            }
        });
        document.getElementById('sb-btn-remove-skill').addEventListener('click', () => {
            const input = document.getElementById('sb-skill-input');
            const skill = input.value.trim();
            if (skill) {
                window.removeSkill(skill);
                input.value = '';
            }
        });
        document.getElementById('sb-btn-add-buff').addEventListener('click', () => {
            const input = document.getElementById('sb-buff-input');
            const buff = input.value.trim();
            if (buff) {
                window.addBuff(buff);
                input.value = '';
            }
        });
        document.getElementById('sb-btn-remove-buff').addEventListener('click', () => {
            const input = document.getElementById('sb-buff-input');
            const buff = input.value.trim();
            if (buff) {
                window.removeBuff(buff);
                input.value = '';
            }
        });
        document.getElementById('sb-btn-add-itembuff').addEventListener('click', () => {
            const input = document.getElementById('sb-itembuff-input');
            const itemId = input.value.trim();
            if (itemId) {
                window.addItemBuff(itemId);
                input.value = '';
            }
        });
        document.getElementById('sb-btn-remove-itembuff').addEventListener('click', () => {
            const input = document.getElementById('sb-itembuff-input');
            const itemId = input.value.trim();
            if (itemId) {
                window.removeItemBuff(itemId);
                input.value = '';
            }
        });
        document.getElementById('sb-move-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('sb-btn-move').click();
        });
        document.getElementById('sb-skill-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('sb-btn-add-skill').click();
        });
        document.getElementById('sb-buff-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('sb-btn-add-buff').click();
        });
        document.getElementById('sb-itembuff-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('sb-btn-add-itembuff').click();
        });
        document.getElementById('sb-btn-party-create').addEventListener('click', () => {
            if (window.__currentParty) {
                window.leaveParty();
                return;
            }
            const expShare = document.getElementById('sb-party-expshare').checked;
            const itemShare = document.getElementById('sb-party-itemshare').checked;
            window.createParty(expShare, itemShare);
        });
        document.getElementById('sb-btn-party-register').addEventListener('click', () => {
            const input = document.getElementById('sb-party-title-input');
            window.registerPartyMatch(input.value);
        });
        document.getElementById('sb-party-title-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('sb-btn-party-register').click();
        });
        document.getElementById('sb-party-autoaccept').addEventListener('change', (e) => {
            window.__autoAcceptApplications = e.target.checked;
            addLog(`Auto-accept applications: ${window.__autoAcceptApplications ? 'ON' : 'OFF'}`, 'info');
        });
        document.getElementById('sb-party-autoaccept-anyone').addEventListener('change', (e) => {
            window.__autoAcceptAnyone = e.target.checked;
            addLog(`Accept anyone (ignore whitelist): ${window.__autoAcceptAnyone ? 'ON' : 'OFF'}`, 'info');
            updatePartyWhitelistPanel();
        });
        document.getElementById('sb-party-autoreform').addEventListener('change', (e) => {
            window.__autoReformParty = e.target.checked;
            addLog(`Auto-reform party: ${window.__autoReformParty ? 'ON' : 'OFF'}`, 'info');
            if (window.__autoReformParty) evaluatePartyReform();
        });
        document.getElementById('sb-btn-party-whitelist-add').addEventListener('click', () => {
            const input = document.getElementById('sb-party-whitelist-input');
            if (input.value.trim()) {
                window.addToPartyWhitelist(input.value);
                input.value = '';
            }
        });
        document.getElementById('sb-party-whitelist-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('sb-btn-party-whitelist-add').click();
        });
        document.getElementById('sb-btn-primarygear-choose').addEventListener('click', () => {
            showInventoryModal();
        });
        document.getElementById('sb-btn-buffgear-choose').addEventListener('click', () => {
            showInventoryModal();
        });
        document.getElementById('sb-btn-partybuff-choose').addEventListener('click', () => {
            getAvailableSkills();
        });
        document.getElementById('sb-btn-buffparty-now').addEventListener('click', () => {
            window.buffPartyNow();
        });

        addLog('Bot helper started.', 'info');
        addLog('Commands: attack(), basicAttack(), addSkill("name"), addBuff("name"), showBuffs(), addItemBuff("itemId"), removeItemBuff("itemId"), getAvailableSkills(), moveTo(x,z), pickup(id), gatherNode(nodeId), addToPartyWhitelist("name"), removeFromPartyWhitelist("name"), addBuff("name", needsWeaponSwap), setBuffNeedsSwap("name", bool), addPartyBuff("name", needsWeaponSwap), removePartyBuff("name"), setPartyBuffNeedsSwap("name", bool), setPrimaryWeapon(itemId), setPrimaryShield(itemId), setBuffWeapon(itemId), setBuffShield(itemId), buffPartyNow(), showWsStatus(), toggleDebug(), exportPacketLog(), copyPacketLog(), startBot(), stopBot(), clearMonsterCache(), createParty(expShare, itemShare), leaveParty(), registerPartyMatch("title"), respondToPartyApplication(charId, accept)', 'info');

        // Safety net in case the WebSocket patch has not run yet (it
        // normally already ran at document-start, before the GUI).
        patchWebSocket();

        // Global (not per-character), so load it once here rather than in
        // the per-character restore block.
        window.__partyAutoAcceptWhitelist = loadPartyWhitelist();

        // Restore saved leveling radius / return-to-center preference into
        // both the inputs and the backing state (center itself is NOT
        // restored - it's always captured fresh on the next Start Bot).
        const savedBotSettings = loadBotSettings();
        if (typeof savedBotSettings.radius === 'number' && savedBotSettings.radius > 0) {
            window.__botRadius = savedBotSettings.radius;
            const radiusInput = document.getElementById('sb-radius-input');
            if (radiusInput) radiusInput.value = savedBotSettings.radius;
        }
        if (typeof savedBotSettings.returnToCenterOnStuck === 'boolean') {
            window.__returnToCenterOnStuck = savedBotSettings.returnToCenterOnStuck;
            const returnCheckbox = document.getElementById('sb-return-center-checkbox');
            if (returnCheckbox) returnCheckbox.checked = savedBotSettings.returnToCenterOnStuck;
        }

        setInterval(updateStatus, 2000);
        updateStatus();
        updateVitalsDisplay();
        updateBotLoopButton();
        updateLevelingStatusLine();
        updatePartyApplicationsPanel();
        updatePartyWhitelistPanel();
        updatePartyStatusPanel();
        updateBuffStatusPanel();
        updateActiveSkillsPanel();
        updateWeaponSettingsPanel();
        updatePartyBuffsPanel();
        updateJobPanel();
    }
    // ============================================================
    //  13b. MONSTER RADAR PANEL
    // ============================================================
    function createMonsterPanel() {
        if (document.getElementById('sb-monster-panel')) {
            document.getElementById('sb-monster-panel').style.display = 'flex';
            return;
        }
        const monsterPanel = document.createElement('div');
        monsterPanel.id = 'sb-monster-panel';
        monsterPanel.innerHTML = `
            <div class="panel-header">
                <span class="panel-title">Monster Radar</span>
                <span>
                    <button class="monster-attack-btn" id="sb-monster-refresh" style="margin-right:8px;">Refresh</button>
                    <span class="panel-close" id="sb-monster-panel-close">&times;</span>
                </span>
            </div>
            <div class="monster-count" id="sb-monster-count">0 monster(s) nearby</div>
            <div class="monster-table-wrap">
                <table>
                    <thead>
                        <tr><th>ID</th><th>Name</th><th>Dist</th><th>X</th><th>Z</th><th></th></tr>
                    </thead>
                    <tbody id="sb-monster-table-body"></tbody>
                </table>
            </div>
        `;
        document.body.appendChild(monsterPanel);

        const showMonsterBtn = document.createElement('button');
        showMonsterBtn.id = 'sb-show-monster-btn';
        showMonsterBtn.textContent = 'Show Monster Radar';
        showMonsterBtn.addEventListener('click', () => {
            monsterPanel.style.display = 'flex';
            showMonsterBtn.style.display = 'none';
        });
        document.body.appendChild(showMonsterBtn);

        document.getElementById('sb-monster-panel-close').addEventListener('click', () => {
            monsterPanel.style.display = 'none';
            showMonsterBtn.style.display = 'block';
        });
        document.getElementById('sb-monster-refresh').addEventListener('click', () => {
            clearMonsterCache();
        });

        // Prune anything that hasn't been updated in a while, then redraw.
        // This is what keeps monsters that quietly left render range from
        // lingering in the radar (and from being picked as attack targets).
        setInterval(() => {
            pruneStaleEntities();
            updateMonsterPanel();
            updateJobPanel();
        }, 1000);
        updateMonsterPanel();
    }
    // ============================================================
    //  14. REINJECT
    // ============================================================
    window.reinjectBot = function() {
        addLog('Reinjecting bot...', 'info');
        const oldPanel = document.getElementById('sb-helper-panel');
        if (oldPanel) oldPanel.remove();
        const showBtn = document.getElementById('sb-show-panel-btn');
        if (showBtn) showBtn.remove();
        const oldMonsterPanel = document.getElementById('sb-monster-panel');
        if (oldMonsterPanel) oldMonsterPanel.remove();
        const showMonsterBtn = document.getElementById('sb-show-monster-btn');
        if (showMonsterBtn) showMonsterBtn.remove();

        // The WebSocket hook is left in place - resetting it would lose the
        // connection to the original constructor.
        window.__entityCache = {};
        window.__activeSkills = [];
        window.__pickupQueue = [];
        window.__logEntries = [];
        window.__currentTarget = null;
        window.__isFighting = false;
        window.__currentGatherNodeId = null;
        window.__isGathering = false;
        window.__weaponSwappedToBuffGear = false;
        window.__weaponSwapPending = null;
        window.__botCenter = null;
        window.__blockedUntil = {};
        resetStuckState();

        setTimeout(() => {
            createPanel();
            createMonsterPanel();
            addLog('Bot reinjected.', 'info');
        }, 100);
    };
    // ============================================================
    //  15. START
    // ============================================================
    // Patch the WebSocket immediately (document-start), independent of the
    // DOM, so we don't miss a connection the page opens before
    // DOMContentLoaded.
    patchWebSocket();
    function createAllPanels() {
        createPanel();
        createMonsterPanel();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createAllPanels);
    } else {
        createAllPanels();
    }
    // Reinject on SPA navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(() => {
                if (!document.getElementById('sb-helper-panel')) {
                    addLog('Navigation detected - reinjecting bot...', 'info');
                    createAllPanels();
                }
            }, 2000);
        }
    }).observe(document, { subtree: true, childList: true });

    console.log('Silkroad Bot Helper loaded.');
    console.log('Commands: attack(), basicAttack(), addSkill("name"), addBuff("name"), showBuffs(), addItemBuff("itemId"), removeItemBuff("itemId"), getAvailableSkills(), moveTo(x,z), pickup(id), gatherNode(nodeId), addToPartyWhitelist("name"), removeFromPartyWhitelist("name"), addBuff("name", needsWeaponSwap), setBuffNeedsSwap("name", bool), addPartyBuff("name", needsWeaponSwap), removePartyBuff("name"), setPartyBuffNeedsSwap("name", bool), setPrimaryWeapon(itemId), setPrimaryShield(itemId), setBuffWeapon(itemId), setBuffShield(itemId), buffPartyNow(), showWsStatus(), toggleDebug(), exportPacketLog(), copyPacketLog(), startBot(), stopBot(), clearMonsterCache(), createParty(expShare, itemShare), leaveParty(), registerPartyMatch("title"), respondToPartyApplication(charId, accept)');
    console.log('If something looks broken, run reinjectBot().');
})();