import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

const ALLOWED_ORIGIN = 'https://www.bbyosummer.org';

export default class BbyoRichTextEditor extends LightningElement {
    @api Contents = ''; // HTML passed to / from Flow
    @api editorUrl = 'https://www.bbyosummer.org/sfmc/dm-email-editor/index.html';
    @api height = 600;
    @api TriggerFinish;
    hasRequestedFinal = false;
    
    frameLoaded = false;

    connectedCallback() {
        this._boundHandleMessage = this.handleMessage.bind(this);
        window.addEventListener('message', this._boundHandleMessage);
    }

    disconnectedCallback() {
        if (this._boundHandleMessage) {
            window.removeEventListener('message', this._boundHandleMessage);
        }
    }

    renderedCallback() {
        if (this.TriggerFinish && !this.hasRequestedFinal) {
            this.hasRequestedFinal = true;

            const iframe = this.template.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(
                    { type: 'requestContent' },
                    ALLOWED_ORIGIN
                );
            }
        }
    }

    get frameStyle() {
        const h = this.height || 600;
        return `width:100%;height:${h}px;border:0;`;
    }

    handleFrameLoad() {
        this.frameLoaded = true;
        this.sendInitMessage();
    }

    sendInitMessage() {
        const iframe = this.template.querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
            return;
        }
        try {
            iframe.contentWindow.postMessage(
                {
                    type: 'init',
                    value: this.Contents || ''
                },
                ALLOWED_ORIGIN
            );
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Error posting init message to editor iframe', e);
        }
    }

    handleMessage(event) {
        const data = event.data;
        // Only accept messages from your TinyMCE domain
        if (!event.origin.includes('bbyosummer.org')) {
            return;
        }

        if (!data || typeof data !== 'object') {
            return;
        }

        // ---------------------------------------
        // LIVE UPDATE (fires on every change)
        // ---------------------------------------
        if (data.type === 'liveUpdate') {
            this.Contents = data.value;

            // Update hidden mirror field
            const mirror = this.template.querySelector('#mirror');
            if (mirror) {
                mirror.value = this.Contents;
            }

            // DO NOT notify Flow yet
            return;
        }
        // ---------------------------------------
        // FINAL SAVE (TinyMCE "change" or requestContent)
        // ---------------------------------------
        if (data.type === 'change' && typeof data.value === 'string') {
            this.Contents = data.value;
            // Update hidden mirror
            const mirror = this.template.querySelector('#mirror');
            if (mirror) {
                mirror.value = this.Contents;
            }
            // Notify Flow ONLY NOW
            this.dispatchEvent(
                new FlowAttributeChangeEvent('Contents', this.Contents)
            );
        }
    }
}
