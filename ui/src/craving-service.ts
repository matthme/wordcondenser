import { decodeEntry, EntryRecord } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  AppClient,
  EntryHash,
  Record,
  RoleNameCallZomeRequest,
} from '@holochain/client';

import {
  Association,
  CommentOnOffer,
  CommentOnReflection,
  Offer,
  Reflection,
  UpdateCommentOnOfferInput,
  UpdateCommentOnReflectionInput,
  UpdateReflectionInput,
  CravingSignal,
  Craving,
} from './condenser/types';

export interface CravingEvents {
  ['signal']: CravingSignal;
}

export class CravingService {
  constructor(
    public client: AppClient,
    public roleName = 'craving',
    public zomeName = 'craving',
    public cravingHash: ActionHash,
    public craving: EntryRecord<Craving>,
  ) {}

  async connect(
    client: AppClient,
    cravingHash: ActionHash,
    roleName = 'craving',
    zomeName = 'craving',
  ) {
    // first try locally, then if it fails go over the network
    let craving: EntryRecord<Craving> | undefined;
    try {
      craving = await this.getCraving(cravingHash);
    } catch (e) {
      console.warn('Failed to get craving locally: ', e);
      craving = await this.getCraving(cravingHash, false);
    }
    if (!craving) throw new Error('Failed to fetch Craving');

    return new CravingService(client, roleName, zomeName, cravingHash, craving);
  }

  // TODO fix signal listener to adapt to ActionHash now
  // on<Name extends keyof CravingEvents>(
  //   listener: (eventData: CravingEvents[Name]) => void | Promise<void>,
  // ): UnsubscribeFunction {
  //   return this.client.on('signal', async signal => {
  //     if (
  //       signal.type === 'app' &&
  //       JSON.stringify(signal.value.cell_id) === JSON.stringify(this.cellId) &&
  //       this.zomeName === signal.value.zome_name
  //     ) {
  //       listener(signal.value.payload as CravingSignal);
  //     }
  //   });
  // }

  /**
   * Gets the Craving for the provided ActionHash.
   *
   * @param actionHash action hash of the original action that created the association
   * @returns Association or undefined if no record found for this entry hash
   */
  async getCraving(
    actionHash: ActionHash,
    local: boolean = true,
  ): Promise<EntryRecord<Craving> | undefined> {
    const record: Record | undefined = await this.callZome('get_craving', {
      input: actionHash,
      local,
    });

    return record ? new EntryRecord(record) : undefined;
  }

  /**
   * Gets the association for the provided entry hash. Associations should be deduplicated,
   * that's why only the entry hash matters.
   *
   * @param entryHash entry hash of the association
   * @returns Association or undefined if no record found for this entry hash
   */
  async getAssociation(
    entryHash: EntryHash,
    local: boolean = true,
  ): Promise<Association | undefined> {
    const record: Record | undefined = await this.callZome('get_association', {
      input: entryHash,
      local,
    });

    return record ? decodeEntry(record) : undefined;
  }

  async createAssociation(
    association: Association,
  ): Promise<EntryRecord<Association> | undefined> {
    const record: Record | undefined = await this.callZome(
      'create_association',
      {
        association,
        craving_hash: this.cravingHash,
      },
    );

    return record ? new EntryRecord(record) : undefined;
  }

  /**
   * Gets the Records of all associations (deduplicated)
   *
   * @returns
   */
  async getAllAssociations(
    cravingHash: ActionHash,
    local: boolean = true,
  ): Promise<Array<Record>> {
    const associations: Array<Record> = await this.callZome(
      'get_associations_for_craving',
      { input: cravingHash, local },
    );

    return associations;
  }

  /**
   * Gets the latest update of the entry corresponding tp this reflection
   *
   * @param originalReflectionHash action hash of the original action that created the reflection
   * @returns Reflection or undefined if no record found for this action hash
   */
  async getReflection(
    originalReflectionHash: ActionHash,
    local: boolean = true,
  ): Promise<EntryRecord<Reflection> | undefined> {
    const record: Record | undefined = await this.callZome('get_reflection', {
      input: originalReflectionHash,
      local,
    });

    return record ? new EntryRecord(record) : undefined;
  }

  async createReflection(
    reflection: Reflection,
  ): Promise<EntryRecord<Reflection> | undefined> {
    const record: Record | undefined = await this.callZome(
      'create_reflection',
      {
        reflection,
        craving_hash: this.cravingHash,
      },
    );

    return record ? new EntryRecord(record) : undefined;
  }

  async updateReflection(
    input: UpdateReflectionInput,
  ): Promise<Reflection | undefined> {
    const record: Record | undefined = await this.callZome(
      'update_reflection',
      input,
    );

    return record ? decodeEntry(record) : undefined;
  }

  async getAllReflections(
    cravingHash: ActionHash,
    local: boolean = true,
  ): Promise<Array<Record>> {
    const reflections: Array<Record> = await this.callZome(
      'get_reflections_for_craving',
      {
        input: cravingHash,
        local,
      },
    );

    return reflections;
  }

  async createCommentOnReflection(
    input: CommentOnReflection,
  ): Promise<EntryRecord<CommentOnReflection> | undefined> {
    const record = await this.callZome('create_comment_on_reflection', input);

    return record ? new EntryRecord(record) : undefined;
  }

  async updateCommentOnReflection(
    input: UpdateCommentOnReflectionInput,
  ): Promise<CommentOnReflection | undefined> {
    const record = await this.callZome('update_comment_on_reflection', input);

    return record ? decodeEntry(record) : undefined;
  }

  async deleteCommentOnReflection(
    originalCommentOnReflectionHash: ActionHash,
  ): Promise<ActionHash> {
    return this.callZome(
      'delete_comment_on_reflection',
      originalCommentOnReflectionHash,
    );
  }

  async getAllCommentsOnReflection(
    originalReflectionHash: ActionHash,
    local: boolean = true,
  ): Promise<Record[]> {
    return this.callZome('get_comment_on_reflections_for_reflection', {
      input: originalReflectionHash,
      local,
    });
  }

  /**
   * Gets the latest update of the entry corresponding tp this reflection
   *
   * @param originalOfferHash action hash of the original action that created the offer
   * @returns Offer or undefined if no record found for this action hash
   */
  async getOffer(
    originalOfferHash: ActionHash,
    local: boolean = true,
  ): Promise<EntryRecord<Offer> | undefined> {
    const record: Record | undefined = await this.callZome('get_offer', {
      input: originalOfferHash,
      local,
    });

    return record ? new EntryRecord(record) : undefined;
  }

  async createOffer(offer: Offer): Promise<EntryRecord<Offer> | undefined> {
    const record: Record | undefined = await this.callZome('create_offer', {
      offer,
      craving_hash: this.cravingHash,
    });

    return record ? new EntryRecord(record) : undefined;
  }

  /**
   * Gets the Records of all offers (deduplicated)
   *
   * @returns
   */
  async getAllOffers(
    cravingHash: ActionHash,
    local: boolean = true,
  ): Promise<Array<Record>> {
    const offers: Array<Record> = await this.callZome(
      'get_offers_for_craving',
      {
        input: cravingHash,
        local,
      },
    );

    return offers;
  }

  async createCommentOnOffer(
    input: CommentOnOffer,
  ): Promise<CommentOnOffer | undefined> {
    const record = await this.callZome('create_comment_on_offer', input);

    return record ? decodeEntry(record) : undefined;
  }

  async updateCommentOnOffer(
    input: UpdateCommentOnOfferInput,
  ): Promise<CommentOnOffer | undefined> {
    const record = await this.callZome('update_comment_on_offer', input);

    return record ? decodeEntry(record) : undefined;
  }

  async deleteCommentOnOffer(
    originalCommentOnOfferHash: ActionHash,
  ): Promise<ActionHash> {
    return this.callZome('delete_comment_on_offer', originalCommentOnOfferHash);
  }

  async resonateWithEntry(entryHash: EntryHash, local = true): Promise<void> {
    return this.callZome('add_resonator_for_entry', {
      input: entryHash,
      local,
    });
  }

  async unresonateWithEntry(entryHash: EntryHash, local = true): Promise<void> {
    return this.callZome('remove_resonator_for_entry', {
      input: entryHash,
      local,
    });
  }

  async getResonatorsForEntry(
    entryHash: EntryHash,
    local: boolean = true,
  ): Promise<AgentPubKey[]> {
    return this.callZome('get_resonators_for_entry', {
      input: entryHash,
      local,
    });
  }

  async resonateWithAction(actionHash: ActionHash): Promise<void> {
    return this.callZome('add_resonator_for_action', actionHash);
  }

  async unresonateWithAction(actionHash: ActionHash): Promise<void> {
    return this.callZome('remove_resonator_for_action', actionHash);
  }

  async getResonatorsForAction(
    actionHash: ActionHash,
    local: boolean = true,
  ): Promise<AgentPubKey> {
    return this.callZome('get_resonators_for_action', {
      input: actionHash,
      local,
    });
  }

  private callZome(fn_name: string, payload: any) {
    const req: RoleNameCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }
}
