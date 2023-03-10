import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AppAgentClient, AgentPubKey } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';

import { clientContext, cravingStoreContext } from '../contexts';
import { sharedStyles } from '../sharedStyles';
import { getHexColorForTimestamp } from '../colors';
import { ReflectionData } from './all-reflections';
import { CravingStore } from '../craving-store';
import { getNickname } from '../utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { CommentOnReflection, CravingDnaProperties } from './types';
import { decodeEntry } from '@holochain-open-dev/utils';

import './create-comment-on-reflection';


/** An element of the association map for a craving.
 *
 * It determines its size based on the age of the association entry and the number
 * of "resonates" it has.
 *
 * */
@customElement('reflection-element')
export class ReflectionElement extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @consume({ context: cravingStoreContext })
  cravingStore!: CravingStore;

  @property()
  reflection!: ReflectionData;

  @property()
  craving!: CravingDnaProperties;

  @state()
  expanded: boolean = false;

  @state()
  showComments: boolean = false;

  private _comments = new StoreSubscriber(
    this,
    () => this.cravingStore.commentsOnReflection(this.reflection.actionHash)
  );

  commentsExist() {
    return this._comments.value.status === "complete" && this._comments.value.value.length !== 0;
  }

  numberOfComments(): number | undefined {
    if (this._comments.value.status === "complete") {
      return this._comments.value.value.length
    } else {
      return undefined
    }
  }


  isMine(author: AgentPubKey) {
    return JSON.stringify(this.client.myPubKey) === JSON.stringify(author);
  }

  getVerb() {
    const verbs = ["reflected", "philosophized", "theorized", "thought", "weighed in", "explored"]
    return verbs[Math.floor(Math.random()*verbs.length)]
  }

  renderComments() {
    switch (this._comments.value.status) {
      case "pending":
        return html`pending`;
      case "error":
        return html`error`
      case "complete":
        return html`
          <div class="column" style="flex-end; padding-left: 40px;">

            ${this._comments.value.value.map((record) => {
                const comment = record ? (decodeEntry(record) as CommentOnReflection) : undefined;
                const author = record.signed_action.hashed.content.author;
                const craving = this.cravingStore.craving;
                const nickName = getNickname(author, craving.title);
                const timestamp = record.signed_action.hashed.content.timestamp;
                const date = new Date(timestamp/1000);


                return html`
                  <div class="container">
                    <div class="row">
                      <span style="display: flex; flex: 1;"></span>
                      <div class="column" style="align-items: flex-end;">
                        <!-- <span style="font-size: 12px; color: #abb5d6">comment by: </span> -->
                        <span
                          style="font-size: 20px; ${this.isMine(author) ? "color: #e06208;" : ""}"
                          title=${this.isMine(author) ? "Yes that's you" : ""}
                        >${nickName}</span>
                        <span style="font-size: 12px; color: #abb5d6; margin-top: 3px;">${date.toLocaleString()}</span>
                      </div>
                    </div>

                    <div class="content" style="margin-top: -20px;">
                      ${comment?.comment}
                    </div>
                  </div>`

            })}

          </div>

          <create-comment-on-reflection .reflectionHash=${this.reflection.actionHash} .cravingCellId=${this.cravingStore.service.cellId}>
          </create-comment-on-reflection>
        `;
    }
  }


  renderReflection() {

    const color = getHexColorForTimestamp(this.reflection.timestamp);
    const date = new Date(this.reflection.timestamp/1000);
    const craving = this.cravingStore.craving;

    return html`
      <div class="container">
        <div class="row">
          <div class="title">${ this.reflection.reflection.title }</div>
          <span style="display: flex; flex: 1;"></span>
          <div
            class="column"
            style="margin: 5px; align-items: flex-end;"
            title="${this.isMine(this.reflection.author) ? "Yes that's you!" : ""}"
          >
            <!-- <span style="font-size: 12px; color: #abb5d6">${this.getVerb()} by: </span> -->
            <span style="font-size: 20px; ${this.isMine(this.reflection.author) ? "color: #e06208;" : ""}">${getNickname(this.reflection.author, craving.title)}</span>
            <span style="font-size: 12px; color: #abb5d6; margin-top: 3px;">${date.toLocaleString()}</span>
          </div>
        </div>
 	      <div class="content" style="${this.expanded ? "" : "height: 100px;"}; min-height: 100px;" >${ this.reflection.reflection.reflection }</div>
        <div class="row footer">
          ${
            this.expanded
              ? html`
                <img
                  src="minimize.svg"
                  class="icon"
                  style="height: 30px; cursor: pointer;"
                  title="minimize"
                  @click=${() => this.expanded = !this.expanded}
                >`
              : html`
                <img
                  src="expand.svg"
                  class="icon"
                  style="height: 30px; cursor: pointer;"
                  title="expand"
                  @click=${() => this.expanded = !this.expanded}

                >`
          }
          <span style="display: flex; flex: 1;"></span>
          <div
            class="row icon ${this.showComments ? "icon-selected" : ""}"
            style="aligng-items: center; cursor: pointer"
            @click=${() => this.showComments = !this.showComments}
          >
            <span style="color: #abb5d6; margin-right: 10px; font-size: 23px;">${this.numberOfComments()}</span>
            <img
              src=${this.commentsExist() ? "comment_filled.svg" : "comment_hollow.svg"}
              style="height: 30px; cursor: pointer;"
              title="comments"
            >
          </div>
        </div>
        <!-- here comes resonator -->
      </div>
    `;
  }


  render() {
    return html`
      ${this.renderReflection()}
      ${ this.showComments ? this.renderComments() : html``}
      `
  }

  static styles = [sharedStyles, css`

    .title {
      white-space: pre-line;
      text-align: left;
      font-size: 23px;
      font-weight: bold;
      color: #abb5d6;
      padding: 10px;
    }

    .content {
      white-space: pre-line;
      text-align: left;
      font-size: 19px;
      color: #abb5d6;
      padding: 10px;
      overflow: hidden;
    }

    .container {
      position: relative;
      background-color: #82828235;
      color: rgb(var(--font-active-color));
      font-size: 26px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      border-radius: 20px;
      margin: 5px 10px;
    }

    .footer {
      height: 50px;
      align-items: center;
      margin-top: 5px;
    }


    .icon {
      background: transparent;
      border-radius: 10px;
      padding: 8px;
    }

    .icon:hover {
      background: #abb5d638;
      border-radius: 10px;
      padding: 8px;
    }

    .icon-selected {
      background: #abb5d638;
      border-radius: 10px;
      padding: 8px;
    }

    .resonator {
      padding: 2px 5px;
      border-radius: 12px;
      cursor: pointer;
      color: rgb(var(--font-active-color));
      border: 1px solid transparent;
      font-size: 24px;
    }

    .resonator:hover {
      border: 1px solid rgb(var(--font-active-color));
    }

    .resonated {
      border: 1px solid rgb(var(--font-active-color));
    }
  `];
}
