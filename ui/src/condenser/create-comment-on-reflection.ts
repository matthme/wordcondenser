import { LitElement, html, css } from 'lit';
import { state, customElement, property, query } from 'lit/decorators.js';
import { ActionHash, Record, AppAgentClient, CellId } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';

import '../components/btn-round';
import '../components/mvb-textfield';

import { clientContext, condenserContext } from '../contexts';
import { CommentOnReflection } from './types';
import { CondenserStore } from '../condenser-store';
import { sharedStyles } from '../sharedStyles';
import { MVBTextArea } from '../components/mvb-textarea';

@customElement('create-comment-on-reflection')
export class CreateCommentOnReflection extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: condenserContext })
  _store!: CondenserStore;

  @property({ type: Object })
  cravingCellId!: CellId;

  @property({ type: Object })
  reflectionHash!: ActionHash;

  @state()
  _comment: string | undefined;

  isCommentValid() {
    return true && this._comment !== undefined && this._comment.length > 2;
  }

  async createComment() {
    const comment: CommentOnReflection = {
      reflection_hash: this.reflectionHash,
      comment: this._comment!,
    };

    try {
      const record: Record = await this.client.callZome({
        cap_secret: null,
        cell_id: this.cravingCellId,
        zome_name: 'craving',
        fn_name: 'create_comment_on_reflection',
        payload: comment,
      });

      this.dispatchEvent(
        new CustomEvent('comment-on-reflection-created', {
          composed: true,
          bubbles: true,
          detail: {
            commentHash: record.signed_action.hashed.hash,
          },
        }),
      );
      this._comment = undefined;
      (
        this.shadowRoot?.getElementById('comment-textarea') as MVBTextArea
      ).clear();
    } catch (e: any) {
      const errorSnackbar = this.shadowRoot?.getElementById(
        'create-error',
      ) as Snackbar;
      errorSnackbar.labelText = `Error creating the comment: ${e.data.data}`;
      errorSnackbar.show();
      this._comment = undefined;
      throw new Error(`Error creating a comment on a reflection: ${e}`);
    }
  }

  render() {
    return html` <mwc-snackbar id="create-error" leading> </mwc-snackbar>

      <div class="container">
        <div class="column" style="display: flex; align-items: flex-end;">
          <mvb-textarea
            id="comment-textarea"
            style="
              --mvb-primary-color: #abb5d6;
              --mvb-secondary-color: #838ba4;
              --mvb-textfield-width: 300px;
              --mvb-textfield-height: 50px;
              --border-width: 1px;
            "
            placeholder="Write comment"
            @input=${(e: CustomEvent) => {
              this._comment = (e.target as any).value;
            }}
            required
          ></mvb-textarea>

          <div
            class="row ${this.isCommentValid() ? 'icon' : 'disabled'}"
            style="align-items: center; margin-top: 5px; ${this.isCommentValid()
              ? ''
              : 'opacity: 0.5;'}"
            @click=${() =>
              this.isCommentValid() ? this.createComment() : undefined}
            @keypress=${(e: KeyboardEvent) =>
              this.isCommentValid() && e.key === 'Enter'
                ? this.createComment()
                : undefined}
            tabindex="0"
          >
            <img style="height: 26px;" src="send_icon.svg" alt="Send icon" />
            <span style="color: #abb5d6; margin-left: 5px; font-size: 23px;"
              >Send</span
            >
          </div>
        </div>
      </div>`;
  }

  static styles = [
    sharedStyles,
    css`
      .container {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-top: 10px;
        margin-right: 12px;
        margin-bottom: 20px;
      }

      .disabled {
        background: transparent;
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
      }

      .icon {
        background: transparent;
        border-radius: 10px;
        padding: 8px;
        cursor: pointer;
      }

      .icon:hover {
        background: #abb5d638;
        border-radius: 10px;
        padding: 8px;
      }
    `,
  ];
}
