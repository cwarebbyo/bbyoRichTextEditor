import { LightningElement, api } from 'lwc';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';

const ALLOWED_ORIGIN = 'https://www.bbyosummer.org';

export default class BbyoRichTextEditor extends LightningElement {
    @api Contents; // HTML passed to / from Flow
    @api editorUrl = 'https://www.bbyosummer.org/sfmc/dm-email-editor/index.html';
    @api height = 600;

    @api finish() {
        console.log("LWC finish() CALLED");

        const iframe = this.template.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            console.log("Posting requestContent to iframe");
            iframe.contentWindow.postMessage(
                { type: 'requestContent' },
                ALLOWED_ORIGIN
            );
        } else {
            console.log("NO iframe.contentWindow FOUND");
        }
    }
    
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
        if (event.origin !== ALLOWED_ORIGIN) {
            return;
        }
        const data = event.data;
        if (!data || typeof data !== 'object') {
            return;
        }
        if (data.type === 'change' && typeof data.value === 'string') {
            this.Contents = data.value;
            // Notify Flow that the value changed
            this.dispatchEvent(
                new FlowAttributeChangeEvent('Contents', this.Contents)
            );
        }
    }
}
