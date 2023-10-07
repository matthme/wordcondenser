import {
  Record,
  ActionHash,
  SignedActionHashed,
  Create,
  Delete,
  Update,
  CreateLink,
  DeleteLink,
} from '@holochain/client';

// !! IMPORTANT !! Order of the attributes matter in order to get the same DNA hash!
export interface CravingDnaProperties {
  title: string;
  description: string;
  max_anecdote_chars: number | null;
  max_association_chars: number | null;
  max_offer_chars: number | null;
  max_reflection_chars: number | null;
}

export interface Offer {
  offer: string;
  explanation: string | undefined;
}

export interface Reflection {
  title: string;
  reflection: string;
}

export interface UpdateReflectionInput {
  original_reflection_hash: ActionHash;
  previous_reflection_hash: ActionHash;
  updated_reflection: Reflection;
}

export interface Association {
  association: string;
}

export interface Anecdote {
  anecdote: string;
}

export interface CommentOnOffer {
  offer_hash: ActionHash;
  comment: string;
}

export interface UpdateCommentOnOfferInput {
  original_comment_on_offer_hash: ActionHash;
  previous_comment_on_offer_hash: ActionHash;
  updated_comment_on_offer: CommentOnReflection;
}

export interface CommentOnReflection {
  reflection_hash: ActionHash;
  comment: string;
}

export interface UpdateCommentOnReflectionInput {
  original_comment_on_reflection_hash: ActionHash;
  previous_comment_on_reflection_hash: ActionHash;
  updated_comment_on_reflection: CommentOnReflection;
}

export type CravingSignal =
  | {
      type: 'EntryCreated';
      action: SignedActionHashed<Create>;
      record: Record;
      app_entry: EntryTypes;
    }
  | {
      type: 'EntryUpdated';
      action: SignedActionHashed<Update>;
      record: Record;
      app_entry: EntryTypes;
      original_record: Record;
      original_app_entry: EntryTypes;
    }
  | {
      type: 'EntryDeleted';
      action: SignedActionHashed<Delete>;
      original_app_entry: EntryTypes;
    }
  | {
      type: 'LinkCreated';
      action: SignedActionHashed<CreateLink>;
      link_type: Object; // for example {EntryToResonator: null}
    }
  | {
      type: 'LinkDeleted';
      action: SignedActionHashed<DeleteLink>;
      link_type: Object;
    };

export type EntryTypes =
  | ({ type: 'Offer' } & Offer)
  | ({ type: 'Reflection' } & Reflection)
  | ({ type: 'Association' } & Association)
  | ({ type: 'Anecdote' } & Anecdote)
  | ({ type: 'CommentOnOffer' } & CommentOnOffer)
  | ({ type: 'CommentOnReflection' } & CommentOnReflection);
