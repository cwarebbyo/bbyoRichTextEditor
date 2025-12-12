/*************************************************************
 *  BBYO EMAIL EDITOR — TinyMCE Integration for Salesforce
 *  Loaded as external JS by index.html
 *************************************************************/

// Pending initial value before TinyMCE initializes
let pendingInitialHtml = '';
let editorInstance = null;
let isPasting = false;
let isUploading = false;
let activeUploads = 0;
let editorReady = false;
let initialContentApplied = false;

/***********************************************
* CHARACTER COUNTER
***********************************************/
function enforceLongTextLimit() {
    const html = editorInstance.getContent({ format: 'html' });
    const count = html.length;
    const MAX_CHARS = 125000;
    const WARNING_THRESHOLD = 0.90;
    let counter = document.querySelector('#bbyo-html-count');

    /***********************************************
    * DO NOT ENFORCE DURING PASTE OR UPLOAD
    ***********************************************/
    if (isPasting || activeUploads > 0) {
        if (counter) {
            counter.style.color = "#666";
            counter.textContent = `Email Size: ${count} (processing images…)`;
        }
        return;
    }

    /***********************************************
    * NORMAL CHARACTER COUNT + WARNINGS
    ***********************************************/
    if (counter) {
        counter.style.color = "#000";
        counter.textContent = `Email Size: ${count}`;

        if (count > MAX_CHARS * WARNING_THRESHOLD && count < MAX_CHARS) {
            counter.style.color = "orange";
            counter.textContent = `Email Size: ${count} — Approaching Salesforce limit`;
        }

        if (count >= MAX_CHARS) {
            counter.style.color = "red";
            counter.textContent = `Email Size: ${MAX_CHARS} — MAX REACHED`;
        }
    }

    /***********************************************
    * HARD STOP ENFORCEMENT (only once uploads are done)
    ***********************************************/
    if (count > MAX_CHARS) {
        const trimmed = html.substring(0, MAX_CHARS);
        editorInstance.setContent(trimmed);
        editorInstance.selection.select(editor.getBody(), true);
        editorInstance.selection.collapse(false);

        alert(
            "Your content exceeds the Salesforce Long Text limit (131,072 characters).\n\n" +
            "Extra content has been removed."
        );
    }
}
/*************************************************************
 *  HTML CLEANUP HELPERS
 *************************************************************/
function removeLeadingEmptyParagraph(html) {
  return html.replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, '');
}
/*************************************************************
 *  WIDTH NORMALIZER — forces any width > 600 down to 600
 *************************************************************/
function normalizeWidths(html) {
  // Match width="123", width='123', or width=123
  return html.replace(/width\s*=\s*(['"]?)(\d+)(\1)/gi, (match, quote, num) => {
    const value = parseInt(num, 10);

    // Leave percentage widths alone (not matched here anyway)
    // Leave small widths alone
    if (value <= 600) {
      return `width=${quote}${value}${quote}`;
    }

    // Force max 600px width
    return `width=${quote}600${quote}`;
  });
}

/*************************************************************
 *  MESSAGE HANDLER — INIT + FINAL SAVE REQUEST
 *  Salesforce Flow should:
 *    - send { type: "init", value: "<html>" } to load content
 *    - send { type: "requestContent" } to get FINAL sanitized HTML
 *************************************************************/
window.addEventListener('message', function(event) {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'init') {
    pendingInitialHtml = data.value || '';
    console.log("[bbyo-editor] INIT received, length =", pendingInitialHtml.length);

    // If editor is ready NOW → apply immediately
    if (editorReady && editorInstance) {
        editorInstance.setContent(pendingInitialHtml);
        initialContentApplied = true;
        pendingInitialHtml = '';
    }
  }

  if (data.type === 'requestContent') {
    if (editorInstance) {
      rewriteLinksOnSave(editorInstance);
      let finalHtml = editorInstance.getContent();
      finalHtml = removeLeadingEmptyParagraph(finalHtml);
      finalHtml = normalizeWidths(finalHtml);
      window.parent.postMessage({ type: 'change', value: finalHtml }, '*');
    } else {
      const fallbackHtmlRaw = pendingInitialHtml || '';
      const fallbackHtml = normalizeWidths(removeLeadingEmptyParagraph(fallbackHtmlRaw));
      window.parent.postMessage({ type: 'change', value: fallbackHtml }, '*');
    }
  }
});

/*************************************************************
 *  CTA COLOR SCHEMES
 *************************************************************/
const CTA_COLOR_SCHEMES = {
  centennial: { label: 'Centennial', textColor: '#D9E1FF', bgColor: '#1A03B5' },
  lox:        { label: 'Lox',        textColor: '#FBDBE4', bgColor: '#E42158' },
  jaffa:      { label: 'Jaffa',      textColor: '#FEE1D7', bgColor: '#F8450A' },
  sunrise:    { label: 'Sunrise',    textColor: '#968200', bgColor: '#F8F90A' },
  pistachio:  { label:'Pistachio',   textColor: '#E7F9DC', bgColor: '#6BBD00' },
  seltzer:    { label: 'Seltzer',    textColor: '#D6FCFF', bgColor: '#00D7EB' },
  black:      { label: 'Black',      textColor: '#FFFFFF', bgColor: '#000000' }
};

// Color map for TinyMCE


const IMGURLS = { 
  "Black": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/c1481a93-ef90-40ee-b756-ab452d5bbdfe.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/c7b7933c-4101-4f20-890a-e76d45c23ae5.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/30ede219-3312-48a3-b8c0-6a28f89ededc.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/a0a5e551-3847-4081-bd31-01a575b8f1d6.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/e6f973ed-4256-406a-be5b-40d6430d4c74.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/a0c89469-86dc-430f-a712-6c091e58ebf6.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/b9aeaf80-4670-4a1a-be3a-d1ef8397fa91.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/8d33c719-a77f-43e8-8d54-67e45638ddd1.png"
  },
  "Centennial": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/ffb978c0-5d39-478c-b764-a46ba31f674a.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/008626c4-5028-43ec-bdc8-64ee2c6d82bb.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/f69b0d8c-234e-44b6-a0d0-5da0eb639385.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/cb4ac843-b130-4bef-a927-9c3c0ca53dc4.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/efeeef52-3075-4bbe-88e4-0077ad20a1ea.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/28d2a5fe-c7bc-4b41-afe9-d347baf82bb2.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/b4ff8572-785e-4829-975c-0c4d22ec2813.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/9aae89cb-38f7-409c-837e-df51487b022e.png"
  },
  "Jaffa": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/4ce0144d-baab-47c2-bc49-cb2a91becd23.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/0d116fb1-cc60-4ab6-acaa-2de14b032802.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/105a484e-9d2b-49ef-8814-c107f21fd420.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/aebc2619-7452-4922-9fce-8650cb1ee73c.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/b7b9e903-4d21-4566-8333-362025dbaa88.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/60c6140f-13fa-489e-bb2a-0bd2bf993cf0.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/64b2bd2e-0c52-420c-b62c-5104de766b73.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/730a6d29-3c43-4011-adbd-40f99366b5fc.png"
  },
  "Lox": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/34ffe2b4-6948-4d1d-b7a4-579e7bf075b5.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/e4e95132-acb5-4d15-af69-b73303dd3de2.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/c2cc3a92-34f4-40e3-abd4-029d59f18426.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/05f3c883-0634-4c03-8941-379e8b520b07.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/0a88160d-441f-41f3-8a01-170da230192e.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/255091f6-d77e-4aa6-a20e-ed9f06b9cbf8.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/b18bb2b4-ed81-441a-9db9-7c4ce201d7cc.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/cf252d16-1f30-4f74-b92e-f63fd13b2194.png"
  },
  "Pistachio": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/8f7d3e77-027d-4c38-9b26-357567d8221d.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/5acafd29-c070-4bc1-a34c-0bbc750383c8.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/6c388fa1-8a76-4df5-89e5-b8ef9aeb3948.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/bc061aad-49e1-47c8-9eca-5da5d8661882.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/f066baf9-bb61-47d8-a691-03e90c57ee82.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/d97493c2-89c5-422e-80e4-268a23274120.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/8b298405-d53e-4316-a958-5df918bdf591.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/90096e22-9ddf-465a-ba4e-8cd4889ec175.png"
  },
  "Seltzer": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/85fda62b-20e1-4948-9943-d38ffc35d836.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/2e31a989-38cd-46b4-a0fe-aca4ca2d1077.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/8cc007c9-6a36-4ce3-819a-146bc91bfa88.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/9165d6a9-18be-4d14-82d2-3e3d00191bc1.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/4d09160e-d92c-49e0-b9ef-542f08c3ccd7.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/720e83e6-0078-4e44-8d91-f92f113aec6e.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/6a7d6684-9c8e-47f7-aa0a-0aea6ea9147c.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/2a36aae8-3ffa-44d9-8c2a-afa998ff515e.png"
  },
  "Sunrise": {
    logo: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/78fa2bfb-2d6a-4a61-bda5-f8735151325f.png",
    fb: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/e0c6c37a-0976-44a2-814c-b5a08f149ab0.png",
    ig: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/2b729ff8-9b23-4c18-baa3-9fa0ae7eb636.png",
    x:  "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/c1476368-3d6a-4c4b-8bd2-fd082bfc829c.png",
    yt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/6418cd42-ba5d-4c26-bcd8-9800a0fff71c.png",
    tt: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/f43eff41-1959-4276-ac21-3f27b56ed726.png",
    li: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/72f1892f-3905-4b6e-888e-5f511ac2d799.png",
    sc: "https://image.connect.bbyo.org/lib/fe3f11747364047c751470/m/1/22ef1f00-836f-436a-9055-ac27c9c9ca83.png"
  }
};

const FOOTER_TEMPLATE = `<table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="600">
  <tr><td>
<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" class="bbyo-footer" style="width:100%;max-width:600px;border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
  <tr>
    <td class="px-20" style="padding-left:15px;padding-right:15px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;">
        <tr>
          <td width="234" class="col-logo" valign="top" style="width:234px;">
            <a href="https://www.bbyo.org" target="_blank" style="text-decoration:none;">
              <img src="__LOGO__" class="logo" width="234" height="78" alt="BBYO" style="display:block;border:0;width:234px;height:78px;">
            </a>
          </td>
          <td width="12" class="col-gap" style="width:12px;font-size:0;line-height:0;">&nbsp;</td>
          <td class="col-social social-td pt-25" valign="middle" align="right" style="text-align:right;padding-top:25px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="social-table" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;margin-left:auto;">
              <tr>
                <td valign="top">
                  <a href="https://www.facebook.com/BBYOInsider" target="_blank" style="display:inline-block;">
                    <img src="__FB__" width="36" height="36" alt="Facebook" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
                <td width="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td valign="top">
                  <a href="https://www.instagram.com/bbyoinsider" target="_blank" style="display:inline-block;">
                    <img src="__IG__" width="36" height="36" alt="Instagram" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
                <td width="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td valign="top">
                  <a href="https://x.com/BBYOInsider" target="_blank" style="display:inline-block;">
                    <img src="__X__" width="36" height="36" alt="X" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
                <td width="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td valign="top">
                  <a href="https://www.youtube.com/user/BBYOtube" target="_blank" style="display:inline-block;">
                    <img src="__YT__" width="36" height="36" alt="YouTube" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
                <td width="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td valign="top">
                  <a href="https://www.tiktok.com/@bbyoinsider" target="_blank" style="display:inline-block;">
                    <img src="__TT__" width="36" height="36" alt="TikTok" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
                <td width="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td valign="top">
                  <a href="https://www.snapchat.com/add/bbyoinsider" target="_blank" style="display:inline-block;">
                    <img src="__SC__" width="36" height="36" alt="Snapchat" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
                <td width="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td valign="top">
                  <a href="https://www.linkedin.com/company/bbyo" target="_blank" style="display:inline-block;">
                    <img src="__LI__" width="36" height="36" alt="LinkedIn" style="display:block;border:0;width:36px;height:36px;">
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="clear:both;line-height:0;font-size:0;">&nbsp;</div>
    </td>
  </tr>
</table>
</td></tr></table>
`;

function generateFooterHtml(colorName) {
  const theme = IMGURLS[colorName] || IMGURLS["Centennial"];
  if (!theme) return "";

  let inner = FOOTER_TEMPLATE
    .replace(/__LOGO__/g, theme.logo)
    .replace(/__FB__/g, theme.fb)
    .replace(/__IG__/g, theme.ig)
    .replace(/__X__/g, theme.x)
    .replace(/__YT__/g, theme.yt)
    .replace(/__TT__/g, theme.tt)
    .replace(/__LI__/g, theme.li)
    .replace(/__SC__/g, theme.sc);

  return (
    '<p></p><div class="bbyo-footer-wrapper mceNonEditable" contenteditable="false" data-color="' + colorName + '">' +
      inner +
    '</div>'
  );
}

function openFooterEditor(editor, footerEl) {
  const currentColor = footerEl.getAttribute('data-color') || 'Centennial';

  editor.windowManager.open({
    title: 'Edit Footer Theme',
    size: 'normal',
    body: {
      type: 'panel',
      items: [
        {
          type: 'selectbox',
          name: 'theme',
          label: 'Footer Color',
          items: [
            { text: 'Black',      value: 'Black' },
            { text: 'Centennial', value: 'Centennial' },
            { text: 'Lox',        value: 'Lox' },
            { text: 'Jaffa',      value: 'Jaffa' },
            { text: 'Sunrise',    value: 'Sunrise' },
            { text: 'Pistachio',  value: 'Pistachio' },
            { text: 'Seltzer',    value: 'Seltzer' }
          ]
        }
      ]
    },
    initialData: {
      theme: currentColor
    },
    buttons: [
      { type: 'cancel', text: 'Cancel' },
      { type: 'submit', text: 'Save', primary: true }
    ],
    onSubmit(api) {
      const data = api.getData();
      const newHtml = generateFooterHtml(data.theme);
      footerEl.outerHTML = newHtml;
      api.close();
      editor.fire('change');
    }
  });
}

const COLOR_MAP = [
  '000000','Black','1A03B5','Centennial','E42158','Lox','F8450A','Jaffa',
  'F8F90A','Sunrise','6BBD00','Pistachio','00D7EB','Seltzer','666666','Gray',
  '0A023C','Deep Centennial','6E0C28','Deep Lox','892706','Deep Jaffa','968200','Deep Sunrise',
  '23450C','Deep Pistachio','004B52','Deep Seltzer','E6E6E6','Light Gray','D9E1FF','Light Centennial',
  'FBDBE4','Light Lox','FEE1D7','Light Jaffa','FEFED7','Light Sunrise',
  'E7F9DC','Light Pistachio','D6FCFF','Light Seltzer','FFFFFF','White'
];

/*************************************************************
 *  SAFE URL SANITIZER
 *************************************************************/
function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^javascript:/i.test(trimmed)) return '';
  return trimmed;
}

/*************************************************************
 *  PNG TRANSPARENCY SAMPLE CHECK
 *************************************************************/
function pngHasTransparency(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let i = 3; i < imgData.length; i += 80) {
      if (imgData[i] < 255) return true;
    }
  } catch (e) {
    return true;
  }
  return false;
}

/*************************************************************
 *  GIF ANIMATION DETECTION
 *************************************************************/
async function isAnimatedGif(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let frames = 0;
  for (let i = 0; i < bytes.length - 9; i++) {
    if (bytes[i] === 0x21 && bytes[i+1] === 0xF9 && bytes[i+8] === 0x2C) {
      frames++;
      if (frames > 1) return true; // animated
    }
  }
  return false; // static
}

/*************************************************************
 *  CLIENT-SIDE IMAGE OPTIMIZER + CONDITIONAL CONVERSION
 *************************************************************/
async function optimizeImage(blob, maxWidth = 600, quality = 0.85) {
  return new Promise(async (resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = async function () {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((maxWidth / width) * height);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let outputType = 'image/jpeg';

      // PNG handling
      if (blob.type === 'image/png') {
        const transparent = pngHasTransparency(canvas);
        outputType = transparent ? 'image/png' : 'image/jpeg';
      }

      // GIF handling
      if (blob.type === 'image/gif') {
        const animated = await isAnimatedGif(blob);
        outputType = animated ? 'image/gif' : 'image/jpeg';
      }

      canvas.toBlob(
        (optimizedBlob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ base64: reader.result, finalBlob: optimizedBlob });
          reader.readAsDataURL(optimizedBlob || blob);
        },
        outputType,
        quality
      );
    };

    img.onerror = function () {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ base64: reader.result, finalBlob: blob });
      reader.readAsDataURL(blob);
    };

    img.src = url;
  });
}

/*************************************************************
 *  COLOR MAPPER (for selects, if you ever need it)
 *************************************************************/
function colorMapToSelectOptions() {
  const options = [];
  for (let i = 0; i < COLOR_MAP.length; i += 2) {
    const value = COLOR_MAP[i];
    const label = COLOR_MAP[i + 1];
    if (!value || !label) continue;
    options.push({ text: label, value: '#' + value });
  }
  return options;
}

/*************************************************************
 *  LINK REWRITER — FINAL SAVE ONLY
 *************************************************************/
function rewriteLinksOnSave(editor) {
  const anchors = editor.dom.select('a[href]');
  const editorHost = 'www.bbyosummer.org';

  anchors.forEach(anchor => {
    let href = anchor.getAttribute('href');
    if (!href) return;

    href = href.trim();
    if (!href) return;

    if (href.startsWith('HTTPGetWrap|')) return;
    if (/^(about:|blob:|mailto:|tel:|javascript:|#)/i.test(href)) return;

    let working = href;

    if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(working) && !/^https?:\/\//i.test(working)) {
      working = 'https://' + working;
    } else if (!/^https?:\/\//i.test(working)) {
      working = 'https://' + working;
    }

    try {
      const urlObj = new URL(working);
      working = urlObj.href;

      if (urlObj.hostname === editorHost) {
        working = urlObj.href;
      }
    } catch (e) {
      return;
    }

    anchor.setAttribute('href', 'HTTPGetWrap|' + working);
  });
}

/*************************************************************
 *  TINYMCE INIT
 *************************************************************/
tinymce.init({
  selector: '#editor',
  license_key: 'gpl',
  height: 600,
  menubar: false,
  branding: false,

  resize: false,
  elementpath: false,

  convert_urls: false,
  remove_script_host: false,
  relative_urls: false,

  plugins: 'link lists table image code emoticons noneditable',
  noneditable_class: 'mceNonEditable',

  paste_data_images: true,

  paste_preprocess: function (plugin, args) {
    let html = args.content;

    // --- REMOVE ---
    // <o:p> tags (empty or containing &nbsp;)
    // HTML comments
    // <style> blocks
    // class attributes
    // style attributes
    // <span> blocks
    // Empty <p> blocks
    // alt attributes
    // v: attributes
    // --- REPLACE ---
    // <b> with <strong>
    // width=468 with 600
    html = html.replace(/<\/?o:p[^>]*>/gi, '')
        .replace(/<!--[\s\S]*?-->/gi, '')
        .replace(/<!\-\-[\s\S]*?\-\->/gi, '') // fallback
        .replace(/<!\[[\s\S]*?\]>/gi, '') // odd MSO fragments without "!--"
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/\sclass\s*=\s*("(?:[^"]*)"|'(?:[^']*)'|[^\s>]+)/gi, '')
        .replace(/\sstyle\s*=\s*("(?:[^"]*)"|'(?:[^']*)'|[^\s>]+)/gi, '')
        .replace(/\salt\s*=\s*("(?:[^"]*)"|'(?:[^']*)'|[^\s>]+)/gi, '')
        .replace(/\sv:[a-z]+\s*=\s*("(?:[^"]*)"|'(?:[^']*)'|[^\s>]+)/gi, '')
        .replace(/\sheight\s*=\s*("(?:[^"]*)"|'(?:[^']*)'|[^\s>]+)/gi, '')
        .replace(/width\s*=\s*["']?\s*468\s*["']?/gi, 'width="600"')
        .replace(/<b(\s*>)/gi, '<strong>')
        .replace(/<\/b>/gi, '</strong>')
        .replace(/<\/?span[^>]*>/gi, '')
        .replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, '');
    // Preserve header image
    html = html.replace(/<img[^>]*class="bbyo-header-image[^"]*"[^>]*>/gi, function(match) {
      return match;
    });

    // Normalize any remaining width attributes > 600
    html = normalizeWidths(html);

    // Assign back to TinyMCE
    args.content = html;
  },

  toolbar: [
    'undo redo | styles | forecolor backcolor | bold italic underline | ' +
    'alignleft aligncenter alignright | bullist numlist | ' +
    'indent outdent | link unlink | table image | bbyoCtaButton bbyoHrButton bbyoHeaderButton bbyoFooterButton | copy cut paste | emoticons | code'
  ],

   /*********************************************************
   *  NEW IMAGE UPLOAD HANDLER — CLIENT OPTIMIZE → SERVER UPLOAD
   *********************************************************/
  images_upload_handler: async (blobInfo) => {

    // Track active uploads
    activeUploads++;
    isUploading = true;

    try {
        const blob = blobInfo.blob();
        const { base64 } = await optimizeImage(blob, 600, 0.85);
        const uploadUrl = "https://www.bbyosummer.org/sfmc/dm-email-editor/img_upload/upload.php";
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: blobInfo.filename(),
                data: base64
            })
        });

        const result = await response.json();
        if (!result.url) throw "Upload failed";
        return result.url;
    } finally {
        // Upload complete
        activeUploads--;
        if (activeUploads <= 0) {
            isUploading = false;
            // Delay enforcement to allow TinyMCE to insert <img src="URL">
            setTimeout(() => {
                enforceLongTextLimit();
            }, 600);
        }
    }
},

  content_style: `
    html { background: #f3f3f3; }
    body {
      background: #ffffff;
      font-family: "Roboto", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #000;
      max-width: 600px;
      margin: 0 auto !important;
      box-sizing: border-box;
    }
    p, h1, h2, h3, h4, h5, h6 {
      padding-left: 10px !important;
      padding-right: 10px !important;
      margin: 0 0 16px 0 !important;
      box-sizing: border-box !important;
    }
    blockquote {
      padding-left: 10px !important;
      padding-right: 10px !important;
      margin: 10px 0 16px 10px !important;
      box-sizing: border-box !important;
      line-height: 150%;
      font-size: 20px;
    }
    li {
      padding-left: 10px !important;
      padding-right: 10px !important;
      margin: 0 0 4px 0 !important;
      box-sizing: border-box !important;
    }
    p > img:only-child {
      padding: 0 !important;
      margin: 0 !important;
    }
    p:has(> img:only-child) {
      padding-left: 0 !important;
      padding-right: 0 !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      border: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
    }
    a { color: #1A03B5; text-decoration: underline; }
    .bbyo-hr-wrapper { cursor: pointer; }
    .bbyo-hr-line { display: block; }
  `,

  style_formats: [
    { title: 'Oversized Title', block: 'h1', styles: { fontSize: '90px', fontWeight: '700', lineHeight: '1.02' }},
    { title: 'Header 1', block: 'h1', styles: { fontSize: '64px', fontWeight: '700', lineHeight: '1.02' }},
    { title: 'Header 2', block: 'h2', styles: { fontSize: '52px', fontWeight: '700', lineHeight: '1.02' }},
    { title: 'Header 3', block: 'h3', styles: { fontSize: '40px', fontWeight: '700', lineHeight: '1.02' }},
    { title: 'Header 4', block: 'h4', styles: { fontSize: '24px', fontWeight: '700' }},
    { title: 'Header 5', block: 'h5', styles: { fontSize: '20px', fontWeight: '700' }},
    { title: 'Header 6', block: 'h6', styles: { fontSize: '18px', fontWeight: '700' }},
    { title: 'Subheader', block: 'p', styles: { fontSize: '24px', lineHeight: '1.4' }},
    { title: 'Quote', block: 'blockquote', styles: { fontSize: '20px' }},
    { title: 'Paragraph', block: 'p', styles: { fontSize: '16px' }},
    { title: 'Paragraph – Italic', inline: 'span', styles: { fontSize: '16px', fontStyle: 'italic' }},
    { title: 'Paragraph – Bold', inline: 'span', styles: { fontSize: '16px', fontWeight: '700' }},
    { title: 'Standard Link', inline: 'a', styles: { fontSize: '16px', color: '#1A03B5', textDecoration: 'underline' }}
  ],

  color_map: COLOR_MAP,
  link_default_target: '_blank',

  table_default_attributes: {
    border: '0', cellpadding: '0', cellspacing: '0', role: 'presentation', width: '100%'
  },

  /* IMAGE RESIZING ENABLED (ONLY FOR IMAGES) */
  object_resizing: 'img',

  /* TABLE RESIZING DISABLED */
  table_resize_bars: false,
  table_sizing_mode: 'fixed',

  /* FORCE STABLE TABLE LAYOUT */
  table_default_styles: {
    width: '100%',
    tableLayout: 'fixed'
  },

  valid_elements: '*[*]',

  /*************************************************************
   *  TINYMCE SETUP
   *************************************************************/
  setup: function(editor) {
    editorInstance = editor;

    editor.on('init', () => {
        editorReady = true;

        // Apply initial content ONLY if queued
        if (!initialContentApplied && pendingInitialHtml) {
            console.log("🔥 Applying initial content because editor is now ready");
            editor.setContent(pendingInitialHtml);
            initialContentApplied = true;
            pendingInitialHtml = '';
        }
    });

   /*************************************************************
    *  LIVE UPDATE — Send content to LWC on every edit
    *************************************************************/
    editor.on('keyup change SetContent Undo Redo', function () {
        if (isUploading || isPasting) return;   // don't send during paste/upload
        if (!initialContentApplied) return;

        let html = editor.getContent();
        html = removeLeadingEmptyParagraph(html);
        html = normalizeWidths(html);
        window.parent.postMessage(
            { type: 'liveUpdate', value: html },
            '*'
        );
    });

    /***********************************************
     * FORCE-CREATE THE COUNTER ONCE STATUSBAR EXISTS
     ***********************************************/
    setTimeout(() => {
        let counter = document.querySelector('#bbyo-html-count');

        if (!counter) {
            const statusbar = editor.getContainer().querySelector('.tox-statusbar');

            if (statusbar) {
                counter = document.createElement('div');
                counter.id = 'bbyo-html-count';
                counter.style.marginLeft = '15px';
                counter.style.fontSize = '12px';
                counter.style.opacity = '0.8';
                counter.textContent = "Email Size: 0";

                statusbar.appendChild(counter);
            }
        }

        // Trigger initial count display
        enforceLongTextLimit();
    }, 200); // slight delay ensures TinyMCE fully builds UI
  
    /*************************************************
    * FULL HTML CHARACTER COUNT + SALESFORCE LIMIT
    * WITH PASTE SUPPORT (OPTION B)
    *************************************************/

    // When user begins a paste
    editor.on('PastePreProcess', () => {
        isPasting = true;
    });

    // After paste completes
    editor.on('PastePostProcess', () => {
        setTimeout(() => {
            isPasting = false;
            enforceLongTextLimit(); 
        }, 300);
    });

    editor.on('keyup change SetContent', function () {
        enforceLongTextLimit();
    });

    /*************************************************
     * CLICK HANDLER — Custom Widgets
     *************************************************/
    editor.on('click', function(e) {
        // Footer click — open footer theme editor
        const footerWrapper = e.target.closest('.bbyo-footer-wrapper');
        if (footerWrapper) {
            e.preventDefault();
            e.stopPropagation();
            openFooterEditor(editor, footerWrapper);
            return;
        }
        // CTA Button click
        const ctaWrapper = e.target.closest('.bbyo-cta-wrapper');
        if (ctaWrapper) {
            e.preventDefault();
            e.stopPropagation();

            const anchor = ctaWrapper.querySelector('a.bbyo-cta');
            if (!anchor) return;

            const rawHref = anchor.getAttribute('href') || '';
            const cleanHref = rawHref.replace(/^HTTPGetWrap\|/, '');

            const initialCta = {
                buttonText: anchor.innerText,
                link: cleanHref,
                linkTitle: anchor.getAttribute('title') || '',
                linkAlias: anchor.getAttribute('alias') || '',
                alignment: ctaWrapper.getAttribute('data-align') || 'center',
                colorScheme: anchor.getAttribute('data-color-scheme') || 'centennial'
            };

            openCtaEditor(editor, ctaWrapper, initialCta);
            return;
        }
        // HR wrapper click → open HR editor
        const hrWrapper = e.target.closest('.bbyo-hr-wrapper');
        if (hrWrapper) {
            e.preventDefault();
            e.stopPropagation();

            const hrEl = hrWrapper.querySelector('hr');
            let width = 100;
            let height = '2';
            let color = '#000000';

            if (hrEl && hrEl.style) {
                const style = hrEl.style;
                if (style.width) {
                    const parsedWidth = parseFloat(style.width);
                    if (!isNaN(parsedWidth)) width = parsedWidth;
                }

                if (style.height) {
                    const parsedHeight = parseFloat(style.height);
                    if (!isNaN(parsedHeight)) height = String(parsedHeight);
                }

                if (style.backgroundColor) {
                    color = style.backgroundColor;
                }
            }

            openHrEditor(editor, hrWrapper, { width, height, color });
            return;
        }
    });

    /*************************************************
     *  CTA BUTTON INSERTOR
     *************************************************/
    editor.ui.registry.addButton('bbyoCtaButton', {
        text: 'BUTTON',
        tooltip: 'Insert BBYO Branded CTA Button',
        onAction: function() {
            openCtaEditor(editor, null, {
                buttonText: 'BUTTON TEXT',
                link: '',
                linkTitle: '',
                linkAlias: '',
                colorScheme: 'centennial',
                alignment: 'center'
            });
        }
    });

    /*************************************************
     *  BBYO HR BUTTON (divider)
     *************************************************/
    editor.ui.registry.addButton('bbyoHrButton', {
        text: 'HR',
        tooltip: 'Insert Divider Line',
        onAction: function () {
            openHrEditor(editor, null, {
                width: 100,
                height: '2',
                color: '#000000'
            });
        }
    });

    /*************************************************
    *  HEADER & FOOTER BUTTONS
    *************************************************/
    editor.ui.registry.addButton('bbyoHeaderButton', {
        text: 'HEADER',
        tooltip: 'Insert default BBYO header image',
        onAction: function () {
            const existingHeader = editor.dom.select('.bbyo-header-image')[0];
            if (existingHeader) {
                return; // do nothing if a header already exists
            }
            const headerHtml = `
                <img class="bbyo-header-image"
                    src="https://www.bbyosummer.org/sfmc/dm-email-editor/bbyo-default-header.png"
                    width="600"
                    style="display:block;width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
                <p></p>
            `;
            const body = editor.getBody();
            body.insertAdjacentHTML('afterbegin', headerHtml);
            editor.fire('change');
        }
    });

    editor.ui.registry.addButton('bbyoFooterButton', {
        text: 'FOOTER',
        tooltip: 'Insert default BBYO footer (if missing)',
        onAction: function () {
            const existingFooter = editor.dom.select('.bbyo-footer-wrapper')[0];
            if (existingFooter) return;

            const footerHtml = generateFooterHtml('Centennial');

            // 1. Save the user’s current selection (cursor position)
            const bookmark = editor.selection.getBookmark(2, true);

            // 2. Temporarily move caret to TRUE END OF DOCUMENT safely
            editor.execCommand('mceEndOfDocument'); // does NOT enter <a>

            // 3. Insert footer WITHOUT adding trailing paragraphs
            editor.insertContent(footerHtml);

            // 4. Restore the user’s original selection
            editor.selection.moveToBookmark(bookmark);

            editor.fire('change');
        }
    });

    /*************************************************
     *  HEADER IMAGE PROTECTION — width + delete guard
     *************************************************/
    // Keep header width/height aligned without disturbing selection
    editor.on('NodeChange', () => {
      const headerImg = editor.dom.select('.bbyo-header-image')[0];
      if (!headerImg) return;

      headerImg.setAttribute('width', '600');
      headerImg.style.width = '600px';
      headerImg.style.height = 'auto';
    });

    // Repair any bad wrapping *after* TinyMCE runs the link command
    editor.on('ExecCommand', (e) => {
      if (e.command !== 'mceLink') return;

      setTimeout(() => {
        const headerImg = editor.dom.select('.bbyo-header-image')[0];
        if (!headerImg) return;

        const parent = headerImg.parentNode;
        if (parent && parent.nodeName === 'A' && parent.parentNode && parent.parentNode.nodeName === 'P') {
          const p = parent.parentNode;
          p.parentNode.insertBefore(parent, p);
          if (p.innerHTML.trim() === '') {
            p.remove();
          }
        } else if (parent && parent.nodeName === 'P') {
          const p = parent;
          p.parentNode.insertBefore(headerImg, p);
          if (p.innerHTML.trim() === '') {
            p.remove();
          }
        }

        const next = headerImg.nextSibling;
        if (next && next.nodeName === 'P' && next.innerHTML.trim() === '') {
          next.remove();
        }
      }, 50);
    });

    /*************************************************
     *  DOM REPAIR — Keep wrappers noneditable
     *************************************************/
    function repairNonEditable() {
      const ctas = editor.dom.select('.bbyo-cta-wrapper');
      ctas.forEach(w => {
        if (!w.classList.contains('mceNonEditable')) {
          w.classList.add('mceNonEditable');
        }
        w.setAttribute('contenteditable', 'false');
      });

      const hrs = editor.dom.select('.bbyo-hr-wrapper');
      hrs.forEach(w => {
        if (!w.classList.contains('mceNonEditable')) {
          w.classList.add('mceNonEditable');
        }
        w.setAttribute('contenteditable', 'false');
      });
    }
    editor.on('NodeChange SetContent', repairNonEditable);
  }
});

/*************************************************************
 *  CTA EDITOR (Insert + Edit)
 *************************************************************/
function openCtaEditor(editor, wrapperEl, initialData) {
  editor.windowManager.open({
    title: wrapperEl ? 'Edit BBYO CTA Button' : 'Insert BBYO CTA Button',
    size: 'normal',
    body: {
      type: 'panel',
      items: [
        { type: 'input', name: 'buttonText', label: 'Button Text' },
        { type: 'input', name: 'link', label: 'Link URL' },
        { type: 'input', name: 'linkTitle', label: 'Link Title' },
        { type: 'input', name: 'linkAlias', label: 'Link Alias' },
        {
          type: 'selectbox',
          name: 'colorScheme',
          label: 'Color Scheme',
          items: Object.keys(CTA_COLOR_SCHEMES).map(key => ({
            text: CTA_COLOR_SCHEMES[key].label, value: key
          }))
        },
        {
          type: 'selectbox',
          name: 'alignment',
          label: 'Alignment',
          items: [
            { text: 'Left', value: 'left' },
            { text: 'Center', value: 'center' },
            { text: 'Right', value: 'right' }
          ]
        }
      ]
    },
    initialData,
    buttons: [
      { type: 'cancel', text: 'Cancel' },
      { type: 'submit', text: wrapperEl ? 'Save' : 'Insert', primary: true }
    ],

    onSubmit(api) {
      const data = api.getData();
      const scheme = CTA_COLOR_SCHEMES[data.colorScheme] || CTA_COLOR_SCHEMES.centennial;

      const safeLink = sanitizeUrl(data.link);

      const align = data.alignment || 'center';

      const updatedHtml = `
        <table width="100%" role="presentation" border="0" cellspacing="0" cellpadding="0" class="bbyo-cta-wrapper mceNonEditable">
            <tr>
                <td align="${align}">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="innertd buttonblock" bgcolor="${scheme.bgColor}" style="border-radius:99px; -moz-border-radius:99px; -webkit-border-radius:99px; color:${scheme.textColor}; background-color:${scheme.bgColor};">
                                <a target="_blank" class="bbyo-cta buttonstyles" style="font-size:16px; font-family:Arial, Helvetica, sans-serif; color:${scheme.textColor}; text-align:center; text-decoration:none; display:block; font-weight:bold; line-height:100%; background-color:${scheme.bgColor}; border:15px solid ${scheme.bgColor}; padding:0px; border-radius:99px; -moz-border-radius:99px; -webkit-border-radius:99px;" 
                                href="${safeLink}" title="${data.linkTitle || ''}" alias="${data.linkAlias || ''}" conversion="true">${data.buttonText}</a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`;

      if (wrapperEl) wrapperEl.outerHTML = updatedHtml;
      else editor.insertContent(updatedHtml);

      api.close();
      editor.fire('change');
    }
  });
}

/*************************************************************
 *  HR EDITOR (Insert + Edit)
 *************************************************************/
function openHrEditor(editor, wrapperEl, initialData) {
  editor.windowManager.open({
    title: wrapperEl ? 'Edit Divider' : 'Insert Divider',
    size: 'normal',
    body: {
      type: 'panel',
      items: [
        {
          type: 'slider',
          name: 'width',
          label: 'Width (%)',
          min: 10,
          max: 100,
          value: initialData.width || 100
        },
        {
          type: 'input',
          name: 'height',
          label: 'Height (px)',
          inputMode: 'numeric',
          value: initialData.height || '2'
        },
        {
          type: 'colorinput',
          name: 'color',
          label: 'Line Color',
          value: initialData.color || '#000000'
        }
      ]
    },
    initialData,
    buttons: [
      { type: 'cancel', text: 'Cancel' },
      { type: 'submit', text: wrapperEl ? 'Save' : 'Insert', primary: true }
    ],

    onSubmit(api) {
      const data = api.getData();
      const widthPct = data.width || 100;
      const heightPx = data.height || '2';
      const color = data.color || '#000000';

      const updatedHtml =
        `<div class="bbyo-hr-wrapper mceNonEditable" data-widget="hr">
            <hr class="bbyo-hr-line" style="width:${widthPct}%;height:${heightPx}px;background-color:${color};border:0;margin:16px auto;">
        </div>`;

      if (wrapperEl) wrapperEl.outerHTML = updatedHtml;
      else editor.insertContent(updatedHtml);

      api.close();
      editor.fire('change');
    }
  });
}
