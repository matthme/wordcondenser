/* eslint-disable no-shadow */
import { LitElement, html, css } from 'lit';
import { state, customElement } from 'lit/decorators.js';
import { localized } from '@lit/localize';

import { sharedStyles } from './sharedStyles';

export enum CravingViewMode {
  Home,
  ShareRhyme,
  ShareSelection,
}

@localized()
@customElement('intro-section')
export class IntroSection extends LitElement {
  @state()
  step: number = 0;

  renderStepCount() {
    return html`
      <div
        style="position: fixed; bottom: 30px; right: 30px; color: #929ab9; font-size: 1.2em;"
      >
        Step ${this.step}/5
      </div>
    `;
  }

  renderWelcome() {
    return html`
      <!-- <div class="column" style="align-items: center; max-width: 1200px; flex: 1; margin: auto;"> -->

      <h1 style="color: #929ab9; margin-top: 100px; margin-bottom: 120px;">
        🎉 The Word Condenser is Greeting You! 🎉
      </h1>

      <div
        class="column"
        style="align-items: center; max-width: 1100px; flex: 1; margin: auto;"
      >
        <div class="section" style="margin-bottom: 70px;">
          I will now lead you through an intro explaining the most important
          things about the
          <a href="https://wordcondenser.com" target="_blank">Word Condenser</a
          >.
        </div>

        <div class="light-bulb-note" style="margin-bottom: 100px;">
          💡 The Word Condenser is built with
          <a href="https://holochain.org" target="_blank">Holochain</a> and is
          therefore fully peer-to-peer. If you haven't been exposed to Holochain
          before it's worth taking the time to read the intro since Holochain
          apps tend to work refreshingly different than apps we're currently
          used to.
        </div>

        <div
          class="confirm-btn"
          style="align-items: center; margin-top: 30px; margin-bottom: 50px;"
          tabindex="0"
          @click=${async () => {
            this.step += 1;
            window.scrollTo(0, 0);
          }}
          @keypress=${async () => {
            this.step += 1;
            window.scrollTo(0, 0);
          }}
        >
          <span style="color: #abb5d6; font-size: 1em;">Start</span>
        </div>
      </div>
    `;
  }

  renderHolochainIsDifferent() {
    return html`
      <div class="column" style="align-items: center; max-width: 1100px; flex: 1; margin: auto;">

        <h2>Holochain is different.</h2>

        <div class="section">Holochain allows us to birth a vast variety of so far unseen patterns of combining our collective intelligence in unimaginably
          rich ways - and most importantly - </div>

        <div class="section" style="text-align: center; margin-bottom: 50px;">
          <i>in a mutually agreed upon manner.</i></span>
        </div>

        <div class="section">The Word Condenser here in front of you is just <i>a single one of those patterns.</i></span></div>

        <div class="section">It is important to be aware of this <b>and it is important to understand the mechanics of
          the space you agree to moving in when you use the Word Condenser.</b></i></div>

        <div class="section">Just as you would like to understand how the tracks, trails and <a href="https://lessshitmorebeauty.com" target="_blank">excrements</a>
        that you leave behind each time you interact with a screen attached to the internet are being interpreted, analyzed, used, shared and fed
        back into our collective body of life on this planet.</div>

      <div class="section">Holochain let's us treat this shared body of ours the way it wants and deserves to be treated.</div>


      <div class="row" style="margin-bottom: 50px;">
        <div
          class="confirm-btn"
          style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
          tabindex="0"
          @click=${async () => {
            this.step -= 1;
            window.scrollTo(0, 0);
          }}
          @keypress=${async () => {
            this.step -= 1;
            window.scrollTo(0, 0);
          }}
        >
          <span style="color: #abb5d6; font-size: 1em;">Next</span>
        </div>
        <div
          class="confirm-btn"
          style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
          tabindex="0"
          @click=${async () => {
            this.step += 1;
            window.scrollTo(0, 0);
          }}
          @keypress=${async () => {
            this.step += 1;
            window.scrollTo(0, 0);
          }}
        >
          <span style="color: #abb5d6; font-size: 1em;">Next</span>
        </div>
      </div>

    </div>

    ${this.renderStepCount()}
  `;
  }

  renderVocabulary1() {
    return html`
        <h2>The Vocabulary #1</h2>

        <div class="column" style="align-items: center; max-width: 1100px; flex: 1; margin: auto;">


          <div class="section">The Word Condenser consists of two main elements: <span style="color: #FFC64C;">Cravings</span>
           and <span style="color: #FFC64C;">Groups</span>.</div>

          <h3 style="color: #FFC64C; opacity: 0.9;">#1 Craving</h3>

          <div class="section">A <span style="color: #FFC64C;">Craving</span> emerges from a strong desire of a person to have a word for something that there does not yet exist a word for.</div>

          <div class="section" style="margin-bottom: 0;">To condense that juice from our collective atmosphere, a <span style="color: #FFC64C;">Craving</span> consists of the following parts:</div>

          <img src="equation.svg" alt="Visualization of the equation Associations + Reflections + Offers = Liquified Human Collective Potential" style="width: 1200px;"/>

          <div class="section">
            <ul>
              <li><b>Associations: </b><br>A single word that you associate with the thing that's looking for a word. Keep it short! It's merely our way to palpate
              our collective space of associations and <i>get a sense of where the fog is dense</i>.</li>
              <li><b>Reflections: </b><br>More in-depth reflections about that thing that's looking for a word, where you may branch off into open-ended realms
              of philosophy, science, history and what your heart desires.</li>
              <li><b>Offers: </b><br>After having been exposed to associations and deep reflections of other peers long enough (and given the right weather
                conditions), it may happen that a drop of precious, liquified human collective potential condenses just right amongst the very synapses of yours.
                So then you may add it to the list of "Offers". </li>
            </ul>
          </div>

          <div class="section">This process of devoted and mindful collective condensation is happening <i>in a dedicated peer-to-peer network</i> for every <span style="color: #FFC64C;">Craving</span>
          that emerges. Or in more technical terms: Every <span style="color: #FFC64C;">Craving</span> is stored in a dedicated "Holochain Cell" in your conductor.</div>

          <div class="section">In order to "join" a <span style="color: #FFC64C;">Craving</span> - that peer-to-peer
             network forming around a word that is about to find its way into our collective consciousness - you need to know
              a secret, unique "network seed" that has been randomly generated when the <span style="color: #FFC64C;">Craving</span> was created.</div>

          <img src="craving_explainer.svg" alt="A visualization of how a peer-to-peer network is formed around a Craving and a secret is required to join it." style="margin-bottom: 30px;" />

          <div class="light-bulb-note" style="margin-top: 20px;">
            💡&nbsp;<b>peer-to-peer network</b><br><br>
            A peer-to-peer network is a bunch of people with their computers collaboratively communicating and sharing data
            just between their very computers and the warm and kind humans sitting in front of them.<br><br>
            No need at all for anyone sitting in between with a big server and asking for fees or just silently selling
            those people's <a href="https://lessshitmorebeauty.com" target="_blank">excrements</a> (others call it data) to advertisers, thus binding our most valuable resource -
             our shared time and attention - and holding hostage our vast latent collective capacity to get together and rock the challenges ahead of us.
          </i></div>

          <div class="row" style="margin-bottom: 50px;">
            <div
              class="confirm-btn"
              style="align-items: center; margin: 30px 10px;"
              tabindex="0"
              @click=${async () => {
                this.step -= 1;
                window.scrollTo(0, 0);
              }}
              @keypress=${async () => {
                this.step -= 1;
                window.scrollTo(0, 0);
              }}
            >
              <span style="color: #abb5d6; font-size: 1em;">Previous</span>
            </div>
            <div
              class="confirm-btn"
              style="align-items: center; margin: 30px 10px;"
              tabindex="0"
              @click=${async () => {
                this.step += 1;
                window.scrollTo(0, 0);
              }}
              @keypress=${async () => {
                this.step += 1;
                window.scrollTo(0, 0);
              }}
            >
              <span style="color: #abb5d6; font-size: 1em;">Next</span>
            </div>
          </div>

        </div>

    ${this.renderStepCount()}

  `;
  }

  renderVocabulary2() {
    return html`
      <h2>The Vocabulary #2</h2>

      <div
        class="column"
        style="align-items: center; max-width: 1100px; flex: 1; margin: auto;"
      >
        <h3 style="color: #FFC64C; opacity: 0.9;">#2 Group</h3>

        <div class="section">
          A <span style="color: #FFC64C;">Group</span> is also a dedicated
          peer-to-peer network. But it is a space to keep track of existing
          Cravings that one may join. It does so by storing the secrets required
          to join a Craving.
        </div>

        <img
          src="how_to_find_them.svg"
          alt="A visualisation of how Cravings can be found"
          style="margin-bottom: 30px;"
        />

        <div class="section">
          Similar to the case of a Craving, in order to join a
          <span style="color: #FFC64C;">Group</span>'s network you need to know
          the name of the <span style="color: #FFC64C;">Group</span>, as well as
          in this case 5 secret words that make up its "network seed".<br /><br />
          You can only get those secret words via communication channels outside
          of the Word Condenser.
        </div>

        <div class="section">
          <b
            >Anyone who knows both, the name of the Group and the 5 secret words
            can join this Group.</b
          >
        </div>

        <div class="section" style="font-size: 0.7em; margin-top: 50px;">
          P.s. I'm in fact urgently craving for a better word for what it
          actually is, instead of "Group". Let me know at
          <a href="mailto:wordcondenser@proton.me" target="_blank"
            >wordcondenser@proton.me</a
          >
          with subject "Drop Group" (pun intended) if you condensed a precious
          drop for it and you may see that warming liquid flow right onto the
          pixels of your screen next time you open me.
        </div>

        <div class="row" style="margin-bottom: 50px;">
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Previous</span>
          </div>
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Next</span>
          </div>
        </div>
      </div>

      ${this.renderStepCount()}
    `;
  }

  renderVocabularyOverview() {
    return html`
      <h2>The Vocabulary - Overview</h2>

      <img
        src="/world_of_wordcondenser.svg"
        alt="A visualization of how the Word Condenser works"
        style="height: 95vh; margin-bottom: 80px;"
      />

      <div
        class="column"
        style="align-items: center; max-width: 1100px; flex: 1; margin: auto;"
      >
        <div class="row" style="margin-bottom: 50px;">
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Previous</span>
          </div>
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Next</span>
          </div>
        </div>
      </div>

      ${this.renderStepCount()}
    `;
  }

  renderSharingIsCaring() {
    return html`
      <h2>Sharing is Caring</h2>

      <div
        class="column"
        style="align-items: center; max-width: 1100px; flex: 1; margin: auto;"
      >
        <div
          class="section"
          style="text-align: center; margin-bottom: 100px; margin-top: -20px;"
        >
          <br />
          As you see, those Cravings -<br />
          and especially the juicy ones,<br />
          can propagate without constraints<br />
          along our lines of social bonds.<br /><br />

          So if you share one with a group of yours<br />
          shaping language, is what you do!<br />
          So be wise and do take care,<br />
          making sure to only share,<br />
          what indeed you want to hear out there!<br />
        </div>

        <div class="row" style="margin-bottom: 50px;">
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Previous</span>
          </div>
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Next</span>
          </div>
        </div>
      </div>

      ${this.renderStepCount()}
    `;
  }

  renderSharingIsCaring2() {
    return html`
      <h2>Sharing is Caring - Final Note</h2>

      <div
        class="column"
        style="align-items: center; max-width: 1100px; flex: 1; margin: auto;"
      >
        <div class="section">
          As you may have realized from the way things work, if you share a
          Craving with spaces where you don't know or trust every single person,
          a Craving can easily end up in hands that do not treat it with the
          care that it deserves from each and every one of us.
        </div>

        <div class="section">
          If you want a Craving to stay within a certain group of people, it is
          recommended to be <i>explicit</i> about this and dive straight into
          the cozy cushion of trust that you have in the all-abundant good
          intent of those beloved peers of yours.
        </div>

        <div class="section">
          So keep your groups tight and warm. It is better to start a new one
          with some of the people of the existing group in it as well, instead
          of having a group grow to numbers where you lose oversight.
        </div>

        <div class="section">
          As a good rule of thumb: Do not ever let a group grow larger than 10
          people.
        </div>

        <div class="row" style="margin-bottom: 50px;">
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step -= 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Previous</span>
          </div>
          <div
            class="confirm-btn"
            style="align-items: center; margin: 30px 10px;"
            tabindex="0"
            @click=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
            @keypress=${async () => {
              this.step += 1;
              window.scrollTo(0, 0);
            }}
          >
            <span style="color: #abb5d6; font-size: 1em;">Let's Go!</span>
          </div>
        </div>
      </div>

      ${this.renderStepCount()}
    `;
  }

  renderfrikkinHolochain() {
    return html`
      <div
        class="column"
        style="align-items: center; max-width: 1600px; flex: 1; margin: auto; justify-content: center; height: 100vh;"
      >
        <div
          style="color: #bfc5de; font-size: 2.8em; margin-bottom: 60px; margin-top: 150px;"
        >
          🚀🚀 It's frikkin' <b>HOLOCHAIN !!</b> 🚀🚀
        </div>

        <div style="color: #bfc5de; font-size: 2em; margin-bottom: 80px;">
          We ain't needin' ads no more to signal to each other what we need and
          want!
        </div>

        <div
          class="confirm-btn"
          style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
          tabindex="0"
          @click=${async () => {
            window.localStorage.setItem('intro-seen', 'true');
            this.dispatchEvent(
              new CustomEvent('intro-finished', {
                composed: true,
                bubbles: true,
              }),
            );
          }}
          @keypress=${async () => {
            window.localStorage.setItem('intro-seen', 'true');
            this.dispatchEvent(
              new CustomEvent('intro-finished', {
                composed: true,
                bubbles: true,
              }),
            );
          }}
        >
          <span style="color: #abb5d6; font-size: 1em;"
            >I'll let it sink in 😍</span
          >
        </div>
      </div>
    `;
  }

  renderDidYou() {
    return html`
      <h2>Sharing is Caring - Final Note</h2>

      <div
        class="column"
        style="align-items: center; max-width: 1100px; flex: 1; margin: auto;"
      >
        <div style="color: #bfc5de; font-size: 1.2em;">Did you??</div>

        <div
          class="confirm-btn"
          style="align-items: center; margin-top: 30px; margin-bottom: 80px;"
          tabindex="0"
          @click=${async () => {
            window.localStorage.setItem('intro-seen', 'true');
            this.dispatchEvent(
              new CustomEvent('intro-finished', {
                composed: true,
                bubbles: true,
              }),
            );
          }}
          @keypress=${async () => {
            window.localStorage.setItem('intro-seen', 'true');
            this.dispatchEvent(
              new CustomEvent('intro-finished', {
                composed: true,
                bubbles: true,
              }),
            );
          }}
        >
          <span style="color: #abb5d6; font-size: 1em;"
            >I'll let it sink in</span
          >
        </div>
      </div>
    `;
  }

  render() {
    switch (this.step) {
      case 0:
        return this.renderWelcome();
      // case 1:
      //   return this.renderHolochainIsDifferent();
      case 1:
        return this.renderVocabulary1();
      case 2:
        return this.renderVocabulary2();
      case 3:
        return this.renderVocabularyOverview();
      case 4:
        return this.renderSharingIsCaring();
      case 5:
        return this.renderSharingIsCaring2();
      case 6:
        return this.renderfrikkinHolochain();
      case 7:
        return this.renderDidYou();
      default:
        return html`nothing to render...`;
    }
  }

  static styles = [
    sharedStyles,
    css`
      .section {
        color: #bfc5de;
        font-size: 0.95em;
        text-align: left;
        margin-bottom: 40px;
        line-height: 1.25em;
        width: 100%;
      }

      .note {
        border-radius: 15px;
        font-size: 0.9em;
        color: #cf4545;
        background: #a9000033;
        border: 4px solid #7d1d1d;
        padding: 15px 20px;
        text-align: left;
        margin-bottom: 50px;
      }

      .light-bulb-note {
        border-radius: 15px;
        font-size: 0.9em;
        color: #bfdec1;
        border: 3px solid #21c30062;
        background: #2bff0017;
        padding: 15px 20px;
        text-align: left;
        margin-bottom: 50px;
      }

      h2 {
        color: #929ab9;
        margin-top: 100px;
        margin-bottom: 80px;
      }

      h3 {
        color: #929ab9;
      }

      a {
        all: unset;
        cursor: pointer;
        color: #6f82cc;
        font-weight: bold;
        text-decoration: underline;
      }
      a:hover {
        color: #3f529d;
      }

      .icon {
        background: transparent;
        border-radius: 20px;
        padding: 8px;
      }

      .icon:hover {
        background: #abb5d638;
        border-radius: 20px;
        padding: 8px;
      }

      .order-selector {
        cursor: pointer;
        font-size: 18px;
        color: #9ba4c2;
        background: transparent;
        border-radius: 8px;
        padding: 8px;
        margin: 3px;
      }

      .order-selector:hover {
        background: #abb5d638;
        border-radius: 8px;
        padding: 8px;
        margin: 3px;
      }

      .order-selector-selected {
        cursor: pointer;
        font-size: 18px;
        color: #9ba4c2;
        background: #abb5d638;
        border-radius: 8px;
        padding: 8px;
        margin: 3px;
      }

      .confirm-btn {
        background: #abb5d61a;
        border-radius: 10px;
        padding: 15px 30px;
        cursor: pointer;
      }

      .confirm-btn:hover {
        background: #abb5d638;
        border-radius: 10px;
        padding: 15px 30px;
      }

      .cancel-btn {
        background: transparent;
        border-radius: 10px;
        padding: 8px 15px;
        cursor: pointer;
      }

      .cancel-btn:hover {
        background: #9e1e1e56;
        border-radius: 10px;
        padding: 8px 15px;
      }

      .group-selection-element {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 19px;
        color: #98a3cf;
        min-height: 90px;
        min-width: 600px;
        background: #c5cded09;
        border-radius: 12px;
        border: 1px solid transparent;
        margin: 6px;
        cursor: pointer;
      }

      li {
        margin-bottom: 20px;
      }

      .group-selection-element:hover {
        background: #c5cded38;
      }

      .selected {
        background: #c5cded38;
        border: 1px solid #c5cded;
      }
    `,
  ];
}
