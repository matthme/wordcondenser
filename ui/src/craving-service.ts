import { decodeEntry } from "@holochain-open-dev/utils";
import { ActionHash, AgentPubKey, AppAgentCallZomeRequest, AppAgentClient, CellId, CellType, EntryHash, Record, ClonedCell } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { UnsubscribeFunction } from "emittery";


import { Association, CommentOnOffer, CommentOnReflection, Offer, Reflection, UpdateCommentOnOfferInput, UpdateCommentOnReflectionInput, UpdateReflectionInput, CravingSignal, CravingDnaProperties } from "./condenser/types";


export interface CravingEvents {
  ["signal"]: CravingSignal;
}

export class CravingService {

  constructor(
    public client: AppAgentClient,
    public zomeName = "craving",
    public cellId: CellId,
  ) {}


  on<Name extends keyof CravingEvents>(
    eventName: Name | readonly Name[],
    listener: (eventData: CravingEvents[Name]) => void | Promise<void>
  ): UnsubscribeFunction {
    return this.client.on(eventName, async (signal) => {
      if (
        JSON.stringify(signal.cell_id) === JSON.stringify(this.cellId) &&
        this.zomeName === signal.zome_name
      ) {
        listener(signal.payload as CravingSignal);
      }
    });
  }

  async getCraving(): Promise<CravingDnaProperties> {
    const appInfo = await this.client.appInfo();
    const cravingCellInfo = appInfo.cell_info["craving"]
      .filter((cellInfo) => (CellType.Cloned in cellInfo))
      .find((cellInfo) => {
        if (CellType.Cloned in cellInfo) {
          const cloneInfo = cellInfo[CellType.Cloned];
          // Attention: potentially this needs JSON.stringification
          if (JSON.stringify(cloneInfo.cell_id[0]) === JSON.stringify(this.cellId[0])
            && JSON.stringify(cloneInfo.cell_id[1]) === JSON.stringify(this.cellId[1])){
              return true;
          }
        }
        return false;
      });

    const craving = decode((cravingCellInfo as { [CellType.Cloned]: ClonedCell })[CellType.Cloned].dna_modifiers.properties) as CravingDnaProperties;

    return craving;
  }

  async getInitTime(): Promise<number> {
    const timestamp_microseconds: number = await this.callZome(
      "get_init_time",
      null,
    );
    return timestamp_microseconds / 1000
  }


  /**
   * Gets the association for the provided entry hash. Associations should be deduplicated,
   * that's why only the entry hash matters.
   *
   * @param entryHash action hash of the original action that created the association
   * @returns Association or undefined if no record found for this entry hash
   */
  async getAssociation(entryHash: EntryHash): Promise<Association | undefined>  {
    const record: Record | undefined = await this.callZome(
      "get_association",
      entryHash,
    );

    return record ? decodeEntry(record) : undefined;
  }

  async createAssociation(association: Association): Promise<Association | undefined>  {
    const record: Record | undefined = await this.callZome(
      "create_association",
      association,
    );

    return record ? decodeEntry(record) : undefined;
  }

  /**
   * Gets the Records of all associations (deduplicated)
   *
   * @returns
   */
  async getAllAssociations(): Promise<Array<Record>> {
    const associations: Array<Record> = await this.callZome(
      "get_all_associations",
      null
    );

    return associations
  }





  /**
   * Gets the latest update of the entry corresponding tp this reflection
   *
   * @param originalReflectionHash action hash of the original action that created the reflection
   * @returns Reflection or undefined if no record found for this action hash
   */
  async getReflection(originalReflectionHash: ActionHash): Promise<Reflection | undefined>  {
    const record: Record | undefined = await this.callZome(
      "get_reflection",
      originalReflectionHash,
    );

    return record ? decodeEntry(record) : undefined;
  }

  async createReflection(reflection: Reflection): Promise<Reflection | undefined>  {
    const record: Record | undefined = await this.callZome(
      "create_reflection",
      reflection,
    );

    return record ? decodeEntry(record) : undefined;
  }

  async updateReflection(input: UpdateReflectionInput): Promise<Reflection | undefined>  {
    const record: Record | undefined = await this.callZome(
      "create_reflection",
      input,
    );

    return record ? decodeEntry(record) : undefined;
  }

  async getAllReflections(): Promise<Array<Record>> {
    const reflections: Array<Record> = await this.callZome(
      "get_all_reflections",
      null
    );

    return reflections
  }

  async createCommentOnReflection(input: CommentOnReflection): Promise<CommentOnReflection | undefined> {
    const record = await this.callZome(
      "create_comment_on_reflection",
      input
    );

    return record ? decodeEntry(record) : undefined;
  }

  async updateCommentOnReflection(input: UpdateCommentOnReflectionInput): Promise<CommentOnReflection | undefined> {
    const record = await this.callZome(
      "update_comment_on_reflection",
      input
    );

    return record ? decodeEntry(record) : undefined;
  }

  async deleteCommentOnReflection(originalCommentOnReflectionHash: ActionHash): Promise<ActionHash> {
    return this.callZome(
      "delete_comment_on_reflection",
      originalCommentOnReflectionHash
    );
  }

  async getAllCommentsOnReflection(originalReflectionHash: ActionHash): Promise<Record[]> {
    return this.callZome(
      "get_comment_on_reflections_for_reflection",
      originalReflectionHash
    );
  }





  /**
   * Gets the latest update of the entry corresponding tp this reflection
   *
   * @param originalOfferHash action hash of the original action that created the offer
   * @returns Offer or undefined if no record found for this action hash
   */
  async getOffer(originalOfferHash: ActionHash): Promise<Offer | undefined>  {
    const record: Record | undefined = await this.callZome(
      "get_offer",
      originalOfferHash,
    );

    return record ? decodeEntry(record) : undefined;
  }

  async createOffer(offer: Offer): Promise<Offer | undefined>  {
    const record: Record | undefined = await this.callZome(
      "create_offer",
      offer,
    );

    return record ? decodeEntry(record) : undefined;
  }

  /**
   * Gets the Records of all offers (deduplicated)
   *
   * @returns
   */
  async getAllOffers(): Promise<Array<Record>> {
    const offers: Array<Record> = await this.callZome(
      "get_all_offers",
      null
    );

    return offers
  }

  async createCommentOnOffer(input: CommentOnOffer): Promise<CommentOnOffer | undefined> {
    const record = await this.callZome(
      "create_comment_on_offer",
      input
    );

    return record ? decodeEntry(record) : undefined;
  }

  async updateCommentOnOffer(input: UpdateCommentOnOfferInput): Promise<CommentOnOffer | undefined> {
    const record = await this.callZome(
      "update_comment_on_offer",
      input
    );

    return record ? decodeEntry(record) : undefined;
  }

  async deleteCommentOnOffer(originalCommentOnOfferHash: ActionHash): Promise<ActionHash> {
    return this.callZome(
      "delete_comment_on_offer",
      originalCommentOnOfferHash
    );
  }






  async resonateWithEntry(entryHash: EntryHash): Promise<void> {
    return this.callZome(
      "add_resonator_for_entry",
      entryHash
    )
  }

  async unresonateWithEntry(entryHash: EntryHash): Promise<void> {
    return this.callZome(
      "remove_resonator_for_entry",
      entryHash
    )
  }

 async getResonatorsForEntry(entryHash: EntryHash): Promise<AgentPubKey[]> {
  return this.callZome(
    "get_resonators_for_entry",
    entryHash
  )
 }




  async resonateWithAction(actionHash: ActionHash): Promise<void> {
    return this.callZome(
      "add_resonator_for_action",
      actionHash
    )
  }

  async unresonateWithAction(actionHash: ActionHash): Promise<void> {
    return this.callZome(
      "remove_resonator_for_action",
      actionHash
    )
  }

 async getResonatorsForAction(actionHash: ActionHash): Promise<AgentPubKey> {
  return this.callZome(
    "get_resonators_for_action",
    actionHash
  )
 }




  private callZome(fn_name: string, payload: any) {
    const req: AppAgentCallZomeRequest = {
      cell_id: this.cellId,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }

}






