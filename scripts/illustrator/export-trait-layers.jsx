#target illustrator
/*
 * Xolo Dojo — Illustrator trait layer exporter
 * ------------------------------------------------------------
 * Exports every trait in the open .ai file as its own transparent PNG,
 * clipped to the artboard, so all traits line up when stacked.
 *
 * Expected Layers panel structure:
 *   Background        <- top-level layer = trait CATEGORY
 *     Blue#40         <- sublayer = one TRAIT ("#40" = optional rarity weight)
 *     Gold#5
 *   Body
 *     ...
 * If a category has no sublayers, each top-level object/group inside it is
 * treated as a trait instead (named from the object's name in the Layers panel).
 *
 * Output:
 *   <output>/01_Background/Blue#40.png   (01 = bottom of the Layers panel = back of the stack)
 *   <output>/02_Body/...
 *   <output>/manifest.csv
 *
 * Layers/sublayers whose names start with "_", "-" or "." are skipped
 * (use this for guides, sketches, notes).
 *
 * The script never saves the document and restores all layer visibility/locks when
 * it finishes. Still, run it on a copy of the .ai file to be safe.
 *
 * Run: Illustrator > File > Scripts > Other Script... (Ctrl/Cmd+F12) and pick this file,
 *      or run it from VS Code with Adobe's "ExtendScript Debugger" extension.
 */
(function () {
    var CONFIG = {
        TARGET_SIZE_PX: 2000,        // output width in px (height follows artboard ratio). 0 = native (1pt = 1px)
        TEST_LIMIT_PER_CATEGORY: 2,  // quick test run: export only N traits per category. 0 = export everything
        DRY_RUN: false,              // true = write manifest.csv only, no PNGs
        SKIP_PREFIXES: ["_", "-", "."],
        INCLUDE_HIDDEN_TRAITS: true, // export traits even if they're currently hidden
        ARTBOARD_INDEX: -1           // -1 = currently active artboard
    };

    if (app.documents.length === 0) {
        alert("Open the Xolo Dojo .ai file first.");
        return;
    }
    var doc = app.activeDocument;

    // ---------- helpers ----------
    function log(msg) { try { $.writeln(msg); } catch (e) {} }
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function trim(s) { return s.replace(/^\s+|\s+$/g, ""); }
    function clean(name) {
        var s = trim(String(name).replace(/[\/\\:\*\?"<>\|]/g, "-"));
        return s.length ? s : "Unnamed";
    }
    function skip(name) {
        for (var i = 0; i < CONFIG.SKIP_PREFIXES.length; i++) {
            if (String(name).indexOf(CONFIG.SKIP_PREFIXES[i]) === 0) return true;
        }
        return false;
    }
    function weightOf(name) {
        var m = String(name).match(/#(\d+(\.\d+)?)\s*$/);
        return m ? m[1] : "";
    }
    function traitValue(name) { return trim(String(name).replace(/#\d+(\.\d+)?\s*$/, "")); }
    function csv(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }

    // ---------- remember original state so we can restore it ----------
    var saved = [];
    function rememberLayer(l) { saved.push({ kind: "layer", obj: l, visible: l.visible, locked: l.locked }); }
    function rememberItem(it) { saved.push({ kind: "item", obj: it, hidden: it.hidden, locked: it.locked }); }
    function restore() {
        var i, s;
        // 1. Illustrator won't let you change objects on a hidden or locked layer
        //    ("Target layer cannot be modified"), so open every layer up first
        for (i = 0; i < saved.length; i++) {
            s = saved[i];
            if (s.kind !== "layer") continue;
            try { s.obj.locked = false; s.obj.visible = true; } catch (e) { log("restore warning: " + e); }
        }
        // 2. restore objects while their layers are still editable
        for (i = 0; i < saved.length; i++) {
            s = saved[i];
            if (s.kind !== "item") continue;
            try {
                s.obj.locked = false;
                s.obj.hidden = s.hidden;
                s.obj.locked = s.locked;
            } catch (e) { log("restore warning: " + e); }
        }
        // 3. restore layers in reverse order: sublayers first, parents last
        for (i = saved.length - 1; i >= 0; i--) {
            s = saved[i];
            if (s.kind !== "layer") continue;
            try {
                s.obj.visible = s.visible;
                s.obj.locked = s.locked;
            } catch (e) { log("restore warning: " + e); }
        }
    }

    // ---------- artboard / scale ----------
    var abIndex = CONFIG.ARTBOARD_INDEX >= 0 ? CONFIG.ARTBOARD_INDEX : doc.artboards.getActiveArtboardIndex();
    doc.artboards.setActiveArtboardIndex(abIndex);
    var rect = doc.artboards[abIndex].artboardRect; // [left, top, right, bottom]
    var abW = rect[2] - rect[0];
    var abH = rect[1] - rect[3];
    var scale = CONFIG.TARGET_SIZE_PX > 0 ? (CONFIG.TARGET_SIZE_PX / abW) * 100 : 100;
    if (scale > 776) {
        alert("Target size is too large for this artboard (Illustrator caps export scale at 776%). Lower TARGET_SIZE_PX.");
        return;
    }
    var outW = Math.round(abW * scale / 100);
    var outH = Math.round(abH * scale / 100);

    // ---------- scan the document ----------
    var topLayers = [];
    var cats = []; // { layer, kind: "layers"|"items", traits: [{obj, name}], strays }
    var totalTraits = 0;
    var warnings = [];

    // Layers panel is top-first; we go bottom-up so 01 = back of the stack
    for (var i = doc.layers.length - 1; i >= 0; i--) {
        var L = doc.layers[i];
        rememberLayer(L);
        topLayers.push(L);
        if (skip(L.name)) continue;

        var cat = { layer: L, kind: "layers", traits: [], allSubs: [] };
        // a layer must be unlocked AND visible before anything on it can be changed,
        // otherwise Illustrator throws "Target layer cannot be modified" (#8705).
        // restore() puts the original visibility/lock back afterwards.
        L.locked = false;
        L.visible = true;

        if (L.layers.length > 0) {
            for (var j = 0; j < L.layers.length; j++) {
                var sub = L.layers[j];
                rememberLayer(sub);
                sub.locked = false;
                cat.allSubs.push(sub);
                if (skip(sub.name)) continue;
                if (!CONFIG.INCLUDE_HIDDEN_TRAITS && !sub.visible) continue;
                cat.traits.push({ obj: sub, name: sub.name });
            }
            // loose objects sitting next to the sublayers show up in EVERY export of this category
            var loose = 0;
            for (var p = 0; p < L.pageItems.length; p++) {
                if (L.pageItems[p].parent.typename === "Layer") loose++;
            }
            if (loose > 0) {
                warnings.push(L.name + ": " + loose + " loose object(s) outside sublayers will appear in every trait of this category");
            }
        } else {
            cat.kind = "items";
            var n = 0;
            for (var k = 0; k < L.pageItems.length; k++) {
                var it = L.pageItems[k];
                if (it.parent.typename !== "Layer") continue;
                n++;
                rememberItem(it);
                it.locked = false;
                var nm = it.name && it.name.length ? it.name : ("Item " + n);
                if (!it.name || !it.name.length) warnings.push(L.name + ": unnamed object exported as \"" + nm + "\"");
                if (skip(nm)) continue;
                if (!CONFIG.INCLUDE_HIDDEN_TRAITS && it.hidden) continue;
                cat.traits.push({ obj: it, name: nm });
            }
        }

        if (cat.traits.length === 0) {
            warnings.push(L.name + ": no traits found, skipped");
            continue;
        }
        cats.push(cat);
        totalTraits += CONFIG.TEST_LIMIT_PER_CATEGORY > 0
            ? Math.min(CONFIG.TEST_LIMIT_PER_CATEGORY, cat.traits.length)
            : cat.traits.length;
    }

    if (cats.length === 0) {
        restore();
        alert("No trait categories found. Expected top-level layers (categories) containing sublayers (traits).");
        return;
    }

    // ---------- confirm ----------
    var summary = "Artboard: " + Math.round(abW) + " x " + Math.round(abH) + " pt  ->  PNG " + outW + " x " + outH + " px\n" +
        "Categories (back to front):\n";
    for (var c0 = 0; c0 < cats.length; c0++) {
        summary += "  " + pad(c0 + 1) + "  " + cats[c0].layer.name + "  (" + cats[c0].traits.length + " traits)\n";
    }
    summary += "\nWill export " + totalTraits + " PNGs" +
        (CONFIG.TEST_LIMIT_PER_CATEGORY > 0 ? " (TEST MODE: " + CONFIG.TEST_LIMIT_PER_CATEGORY + " per category)" : "") +
        (CONFIG.DRY_RUN ? " (DRY RUN: manifest only)" : "") + ".";
    if (warnings.length) summary += "\n\nWarnings:\n  " + warnings.slice(0, 10).join("\n  ") + (warnings.length > 10 ? "\n  ..." : "");
    log(summary);

    if (!confirm(summary + "\n\nContinue?")) { restore(); return; }

    var outRoot = Folder.selectDialog("Choose an empty output folder for the trait PNGs");
    if (!outRoot) { restore(); return; }

    // ---------- export ----------
    var opts = new ExportOptionsPNG24();
    opts.transparency = true;
    opts.antiAliasing = true;
    opts.artBoardClipping = true;
    opts.horizontalScale = scale;
    opts.verticalScale = scale;

    var manifest = ["category_order,category,trait,weight,layer_name,file"];
    var exported = 0;
    var started = new Date().getTime();
    var prevUIL = app.userInteractionLevel;

    try {
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

        // hide every top-level layer (including skipped ones)
        for (var t = 0; t < topLayers.length; t++) topLayers[t].visible = false;

        for (var c = 0; c < cats.length; c++) {
            var C = cats[c];
            var folderName = pad(c + 1) + "_" + clean(C.layer.name);
            var dir = new Folder(outRoot.fsName + "/" + folderName);
            if (!CONFIG.DRY_RUN && !dir.exists) dir.create();

            C.layer.visible = true;

            // hide everything inside the category first
            if (C.kind === "layers") {
                for (var a = 0; a < C.allSubs.length; a++) C.allSubs[a].visible = false;
            } else {
                for (var b = 0; b < C.traits.length; b++) C.traits[b].obj.hidden = true;
            }

            var used = {};
            var limit = CONFIG.TEST_LIMIT_PER_CATEGORY > 0
                ? Math.min(CONFIG.TEST_LIMIT_PER_CATEGORY, C.traits.length)
                : C.traits.length;

            for (var s = 0; s < limit; s++) {
                var T = C.traits[s];
                var base = clean(T.name);
                var fname = base, dup = 2;
                while (used[fname.toLowerCase()]) { fname = base + "_" + dup; dup++; }
                if (fname !== base) warnings.push(C.layer.name + ": duplicate trait name \"" + base + "\" saved as \"" + fname + "\"");
                used[fname.toLowerCase()] = true;

                var file = new File(dir.fsName + "/" + fname + ".png");

                if (C.kind === "layers") T.obj.visible = true; else T.obj.hidden = false;

                if (!CONFIG.DRY_RUN) doc.exportFile(file, ExportType.PNG24, opts);

                if (C.kind === "layers") T.obj.visible = false; else T.obj.hidden = true;

                exported++;
                manifest.push([pad(c + 1), csv(C.layer.name), csv(traitValue(T.name)), weightOf(T.name),
                    csv(T.name), csv(folderName + "/" + fname + ".png")].join(","));
                log("[" + exported + "/" + totalTraits + "] " + folderName + "/" + fname + ".png");
            }

            C.layer.visible = false;
        }

        var mf = new File(outRoot.fsName + "/manifest.csv");
        mf.encoding = "UTF-8";
        mf.open("w");
        mf.write(manifest.join("\n"));
        mf.close();
    } catch (err) {
        app.userInteractionLevel = prevUIL;
        restore();
        alert("Export stopped on error:\n" + err + (err.line ? "\n(line " + err.line + ")" : "") +
            "\n\nExported " + exported + " files before the error. Layer visibility has been restored.");
        return;
    }

    app.userInteractionLevel = prevUIL;
    restore();

    var secs = Math.round((new Date().getTime() - started) / 1000);
    var done = (CONFIG.DRY_RUN ? "Dry run complete. " : "Done! ") + exported + " PNGs in " + secs + "s\n" + outRoot.fsName;
    if (warnings.length) done += "\n\nWarnings:\n  " + warnings.slice(0, 15).join("\n  ") + (warnings.length > 15 ? "\n  ..." : "");
    log(done);
    alert(done);
})();
