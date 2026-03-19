import jsPDF from "jspdf";

export function generateCertificate({ userName, userEmail, courseName, category, level, totalLessons, hours }) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W  = doc.internal.pageSize.getWidth();   // 297
    const H  = doc.internal.pageSize.getHeight();  // 210

    const date      = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const verifyId  = "EDU-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const rawName   = userName || userEmail?.split("@")[0] || "Student";
    // Capitalise each word nicely
    const displayName = rawName.replace(/\b\w/g, c => c.toUpperCase());

    /* ══════════════════════════════════════════════════════════════
       COLOUR PALETTE — clean black/gold on white
    ══════════════════════════════════════════════════════════════ */
    const BLACK  = [10,  10,  10 ];
    const DKGRAY = [40,  40,  40 ];
    const MGRAY  = [100, 100, 100];
    const LGRAY  = [180, 180, 180];
    const GOLD   = [182, 148, 72 ];   // muted antique gold
    const LGOLD  = [214, 185, 116];
    const WHITE  = [255, 255, 255];

    const M   = 12;   // outer margin
    const M2  = 16;   // inner margin
    const LM  = 26;   // left content margin

    /* ── 1. Pure white background ─────────────────────────────── */
    doc.setFillColor(...WHITE);
    doc.rect(0, 0, W, H, "F");

    /* ── 2. Double border frame ───────────────────────────────── */
    // Outer border — thin black
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(1.4);
    doc.rect(M, M, W - M * 2, H - M * 2);

    // Inner border — thin gold, inset 4 mm
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.rect(M + 4, M + 4, W - (M + 4) * 2, H - (M + 4) * 2);

    /* ── 3. Corner ornaments ──────────────────────────────────── */
    // Draw small gold squares at every inner-border corner
    const corners = [
        [M + 4, M + 4],
        [W - M - 4, M + 4],
        [M + 4, H - M - 4],
        [W - M - 4, H - M - 4],
    ];
    corners.forEach(([cx, cy]) => {
        doc.setFillColor(...GOLD);
        doc.rect(cx - 2, cy - 2, 4, 4, "F");
        doc.setFillColor(...WHITE);
        doc.rect(cx - 1, cy - 1, 2, 2, "F");
    });

    /* ── 4. Top-left EduNest branding ────────────────────────── */
    // Book icon — clean, minimal, drawn at LM, 24
    const bx = LM, by = 22;
    const bW = 9, bH = 11;
    doc.setFillColor(...BLACK);
    doc.roundedRect(bx,       by, bW - 1, bH, 0.8, 0.8, "F");  // left page
    doc.roundedRect(bx + bW,  by, bW - 1, bH, 0.8, 0.8, "F");  // right page
    // Spine
    doc.setFillColor(...GOLD);
    doc.rect(bx + bW - 1, by, 2, bH, "F");
    // White page lines
    doc.setFillColor(...WHITE);
    doc.rect(bx + 1.5, by + 2,   5, 0.9, "F");
    doc.rect(bx + 1.5, by + 4.5, 5, 0.9, "F");
    doc.rect(bx + 1.5, by + 7,   3, 0.9, "F");
    doc.rect(bx + bW + 1.5, by + 2,   5, 0.9, "F");
    doc.rect(bx + bW + 1.5, by + 4.5, 5, 0.9, "F");
    doc.rect(bx + bW + 1.5, by + 7,   3, 0.9, "F");

    // "EduNest" — large, single word, bold
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text("EduNest", LM + bW * 2 + 4, by + 9);

    // Tagline in gold
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GOLD);
    doc.text("L E A R N I N G  P L A T F O R M", LM + bW * 2 + 4, by + 14.5);

    /* ── 5. Gold horizontal divider ──────────────────────────── */
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.line(LM, 41, W - LM, 41);

    // Thin black line just below
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    doc.line(LM, 42.2, W - LM, 42.2);

    /* ── 6. "CERTIFICATE OF COMPLETION" — centre, hero ───────── */
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MGRAY);
    doc.text("C E R T I F I C A T E   O F   C O M P L E T I O N", W / 2, 50, { align: "center" });

    /* ── 7. "This certifies that" ────────────────────────────── */
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MGRAY);
    doc.text("This certifies that", LM, 62);

    /* ── 8. Student Name — large, premium ────────────────────── */
    const maxNW = W - LM * 2 - 55;  // leave room for seal on right
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    // Auto-shrink if name is wide
    while (doc.getTextWidth(displayName) > maxNW && doc.getFontSize() > 22) {
        doc.setFontSize(doc.getFontSize() - 2);
    }
    doc.text(displayName, LM, 78);

    // Underline with gold  
    const nameW2 = Math.min(doc.getTextWidth(displayName), maxNW);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.2);
    doc.line(LM, 81, LM + nameW2, 81);

    /* ── 9. "has successfully completed" ─────────────────────── */
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MGRAY);
    doc.text("has successfully completed", LM, 91);

    /* ── 10. Course name ─────────────────────────────────────── */
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    const cLines = doc.splitTextToSize(courseName, maxNW + 20);
    doc.text(cLines, LM, 101);
    const afterC = 101 + (cLines.length - 1) * 8;

    // Category subtitle
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MGRAY);
    doc.text(
        "An online course in " + category + ", offered through EduNest Learning Platform",
        LM, afterC + 8
    );

    /* ── 11. Meta row (level · lessons · duration · date) ─────── */
    const metaY = afterC + 20;
    const metaItems = [
        { label: "LEVEL",    val: level },
        { label: "LESSONS",  val: totalLessons + " Modules" },
        { label: "DURATION", val: hours },
        { label: "DATE",     val: date },
    ];
    let mx = LM;
    metaItems.forEach((item, i) => {
        // Gold dot separator (not before first)
        if (i > 0) {
            doc.setFillColor(...GOLD);
            doc.circle(mx - 4, metaY - 1.5, 0.8, "F");
        }
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GOLD);
        doc.text(item.label, mx, metaY - 3);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DKGRAY);
        doc.text(item.val, mx, metaY + 3);
        mx += doc.getTextWidth(item.val) + 12;
    });

    /* ── 12. Signature section ───────────────────────────────── */
    const sigY = H - 48;

    // Signature text stylised
    doc.setFontSize(16);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(...BLACK);
    doc.text("EduNest", LM, sigY - 3);

    doc.setDrawColor(...BLACK);
    doc.setLineWidth(0.5);
    doc.line(LM, sigY, LM + 52, sigY);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MGRAY);
    doc.text("EduNest Learning Platform", LM, sigY + 5.5);
    doc.text("Authorised Certification Body", LM, sigY + 10.5);

    /* ── 13. Bottom divider & footer ─────────────────────────── */
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.2);
    doc.line(LM, H - 32, W - LM, H - 32);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MGRAY);
    doc.text("Certificate ID: " + verifyId, LM, H - 25);
    
    // Center the verify text
    doc.text("Verify at: edunest.app/verify/" + verifyId, W / 2, H - 25, { align: "center" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text("EduNest", W - LM, H - 27.5, { align: "right" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MGRAY);
    doc.text("edunest.app", W - LM, H - 23.5, { align: "right" });

    /* ════════════════════════════════════════════════════════════
       SEAL — bottom-right quadrant, elegant & minimal
    ════════════════════════════════════════════════════════════ */
    const sX  = W - 62;   // seal centre X
    const sY  = 118;      // seal centre Y
    const R1  = 30;       // outer ring radius
    const R2  = 26.5;     // inner ring border
    const R3  = 24;       // fill circle

    /* Subtle drop shadow */
    doc.setFillColor(220, 220, 220);
    doc.circle(sX + 1.2, sY + 1.2, R1, "F");

    /* Gold outer ring */
    doc.setFillColor(...GOLD);
    doc.circle(sX, sY, R1, "F");

    /* Thin black ring */
    doc.setFillColor(...BLACK);
    doc.circle(sX, sY, R2, "F");

    /* White interior */
    doc.setFillColor(...WHITE);
    doc.circle(sX, sY, R3, "F");

    /* Elegant dotted inner circle */
    const dots = 48;
    const dR = R3 - 2;
    for (let i = 0; i < dots; i++) {
        const angle = (i / dots) * 2 * Math.PI;
        const dx = sX + dR * Math.cos(angle);
        const dy = sY + dR * Math.sin(angle);
        doc.setFillColor(...GOLD);
        doc.circle(dx, dy, 0.55, "F");
    }

    /* Inner gold ring */
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.circle(sX, sY, R3 - 4);

    // Helper to draw gold diamond
    const drawDiamond = (cx, cy, r) => {
        doc.setFillColor(...GOLD);
        // Draw using pure paths to avoid character encoding issues in jsPDF
        doc.lines([[r, 0], [-r, r], [-r, -r], [r, -r]], cx - r, cy, [1, 1], "F");
    };

    /* ── Seal interior content ────────────────────────────────── */
    // Top diamond
    const starY = sY - R3 + 6;
    drawDiamond(sX, starY, 1.5);

    // Thin gold divider
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.line(sX - 10, starY + 3.5, sX + 10, starY + 3.5);

    // "EduNest" large, centered
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text("EduNest", sX, sY - 3, { align: "center" });

    // "CERTIFIED" in gold, spaced
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text("C E R T I F I E D", sX, sY + 6, { align: "center" });

    // Horizontal gold line
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.line(sX - 12, sY + 9, sX + 12, sY + 9);

    // Year
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DKGRAY);
    doc.text(new Date().getFullYear().toString(), sX, sY + 15, { align: "center" });

    // Two small diamonds at bottom of seal
    drawDiamond(sX - 6, sY + 20, 1.2);
    drawDiamond(sX + 6, sY + 20, 1.2);

    /* ── Save / Return ─────────────────────────────────────────── */
    return doc;
}

export async function generateAndUploadCertificate(args, supabase) {
    const doc = generateCertificate(args);
    const blob = doc.output("blob");
    const fileName = `cert_${args.userId}_${args.assessmentId || 'standalone'}.pdf`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('certificates')
        .upload(fileName, blob, { upsert: true, contentType: 'application/pdf' });

    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

    const { data: certRecord, error: dbErr } = await supabase
        .from("certificates")
        .upsert({
            user_id: args.userId,
            assessment_id: args.assessmentId,
            course_id: args.courseId,
            issued_name: args.userName,
            certificate_url: publicUrl
        })
        .select()
        .single();

    if (dbErr) throw dbErr;
    
    // Also trigger download for user convenience
    doc.save(`EduNest_Certificate_${args.courseName.replace(/\s+/g, "_")}.pdf`);
    
    return { record: certRecord, url: publicUrl };
}
