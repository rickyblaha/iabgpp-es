import { AbstractEncodableBitStringDataType } from "../datatype/AbstractEncodableBitStringDataType.js";
import { AbstractEncodableSegmentedBitStringSection } from "./AbstractEncodableSegmentedBitStringSection.js";
import { EncodableBoolean } from "../datatype/EncodableBoolean.js";
import { EncodableFixedInteger } from "../datatype/EncodableFixedInteger.js";
import { EncodableFixedIntegerList } from "../datatype/EncodableFixedIntegerList.js";
import { DecodingError } from "../error/DecodingError.js";
import { Base64UrlEncoder } from "../datatype/encoder/Base64UrlEncoder.js";
import { UspCtV1Field } from "../field/UspCtV1Field.js";

export class UspCtV1 extends AbstractEncodableSegmentedBitStringSection {
  public static readonly ID = 12;
  public static readonly VERSION = 1;
  public static readonly NAME = "uspctv1";

  constructor(encodedString?: string) {
    let fields = new Map<string, AbstractEncodableBitStringDataType<any>>();

    // core section
    fields.set(UspCtV1Field.VERSION.toString(), new EncodableFixedInteger(6, UspCtV1.VERSION));
    fields.set(UspCtV1Field.SHARING_NOTICE.toString(), new EncodableFixedInteger(2, 0));
    fields.set(UspCtV1Field.SALE_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0));
    fields.set(UspCtV1Field.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(), new EncodableFixedInteger(2, 0));
    fields.set(UspCtV1Field.SALE_OPT_OUT.toString(), new EncodableFixedInteger(2, 0));
    fields.set(UspCtV1Field.TARGETED_ADVERTISING_OPT_OUT.toString(), new EncodableFixedInteger(2, 0));
    fields.set(
      UspCtV1Field.SENSITIVE_DATA_PROCESSING.toString(),
      new EncodableFixedIntegerList(2, 8, [0, 0, 0, 0, 0, 0, 0, 0])
    );
    fields.set(
      UspCtV1Field.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(),
      new EncodableFixedIntegerList(2, 3, [0, 0, 0])
    );
    fields.set(UspCtV1Field.MSPA_COVERED_TRANSACTION.toString(), new EncodableFixedInteger(2, 0));
    fields.set(UspCtV1Field.MSPA_OPT_OUT_OPTION_MODE.toString(), new EncodableFixedInteger(2, 0));
    fields.set(UspCtV1Field.MSPA_SERVICE_PROVIDER_MODE.toString(), new EncodableFixedInteger(2, 0));

    // publisher purposes segment
    fields.set(UspCtV1Field.GPC_SEGMENT_TYPE.toString(), new EncodableFixedInteger(2, 1));
    fields.set(UspCtV1Field.GPC.toString(), new EncodableBoolean(false));

    let coreSegment = [
      UspCtV1Field.VERSION.toString(),
      UspCtV1Field.SHARING_NOTICE.toString(),
      UspCtV1Field.SALE_OPT_OUT_NOTICE.toString(),
      UspCtV1Field.TARGETED_ADVERTISING_OPT_OUT_NOTICE.toString(),
      UspCtV1Field.SALE_OPT_OUT.toString(),
      UspCtV1Field.TARGETED_ADVERTISING_OPT_OUT.toString(),
      UspCtV1Field.SENSITIVE_DATA_PROCESSING.toString(),
      UspCtV1Field.KNOWN_CHILD_SENSITIVE_DATA_CONSENTS.toString(),
      UspCtV1Field.MSPA_COVERED_TRANSACTION.toString(),
      UspCtV1Field.MSPA_OPT_OUT_OPTION_MODE.toString(),
      UspCtV1Field.MSPA_SERVICE_PROVIDER_MODE.toString(),
    ];

    let gpcSegment = [UspCtV1Field.GPC_SEGMENT_TYPE.toString(), UspCtV1Field.GPC.toString()];

    let segments = [coreSegment, gpcSegment];

    super(fields, segments);

    if (encodedString && encodedString.length > 0) {
      this.decode(encodedString);
    }
  }

  //Overriden
  public encode(): string {
    let segmentBitStrings = this.encodeSegmentsToBitStrings();
    let encodedSegments = [];
    encodedSegments.push(Base64UrlEncoder.encode(segmentBitStrings[0]));
    if (segmentBitStrings[1] && segmentBitStrings[1].length > 0) {
      encodedSegments.push(Base64UrlEncoder.encode(segmentBitStrings[1]));
    }

    return encodedSegments.join(".");
  }

  //Overriden
  public decode(encodedSection: string): void {
    let encodedSegments = encodedSection.split(".");
    let segmentBitStrings = [];
    for (let i = 0; i < encodedSegments.length; i++) {
      /**
       * first char will contain 6 bits, we only need the first 2.
       * There is no segment type for the CORE string. Instead the first 6 bits are reserved for the
       * encoding version, but because we're only on a maximum of encoding version 2 the first 2 bits in
       * the core segment will evaluate to 0.
       */
      let segmentBitString = Base64UrlEncoder.decode(encodedSegments[i]);
      switch (segmentBitString.substring(0, 2)) {
        // unfortuCtely, the segment ordering doesn't match the segment ids
        case "00": {
          segmentBitStrings[0] = segmentBitString;
          break;
        }
        case "01": {
          segmentBitStrings[1] = segmentBitString;
          break;
        }
        default: {
          throw new DecodingError("Unable to decode segment '" + encodedSegments[i] + "'");
        }
      }
    }
    this.decodeSegmentsFromBitStrings(segmentBitStrings);
  }

  //Overriden
  public getId(): number {
    return UspCtV1.ID;
  }

  //Overriden
  public getName(): string {
    return UspCtV1.NAME;
  }
}
