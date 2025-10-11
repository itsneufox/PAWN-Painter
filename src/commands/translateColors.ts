import { MultiStepInput } from "../multiStepInput";
import { PawnColorFormatTo, CommandType } from "../utils/enums";

interface State {
  format: { label: string };
  area: { label: string };
}

export async function translateColors() {
  const state: Partial<State> = {};

  await MultiStepInput.run((input) => pickFormat(input, state));
  return state as State;
}

async function pickFormat(input: MultiStepInput, state: Partial<State>) {
  const formats = [
    { label: PawnColorFormatTo.PAWN_HEX, description: "0xRRGGBBAA" },
    { label: PawnColorFormatTo.PAWN_HEX_NO_ALPHA, description: "0xRRGGBB" },
    { label: PawnColorFormatTo.PAWN_BRACED, description: "{RRGGBB}" },
    { label: PawnColorFormatTo.PAWN_DECIMAL, description: "Decimal number" },
    { label: PawnColorFormatTo.PAWN_RGB, description: "r, g, b" },
  ];

  const pick = await input.showQuickPick({
    title: "Translate PAWN Colors",
    step: 1,
    totalSteps: 2,
    placeholder: "Pick a PAWN color format",
    items: formats,
    shouldResume: () => Promise.resolve(false),
  });

  state.format = pick;
  return (input: MultiStepInput) => pickArea(input, state);
}

async function pickArea(input: MultiStepInput, state: Partial<State>) {
  const areas = [
    { label: CommandType.SELECTION, description: "Selected text only" },
    { label: CommandType.LINE, description: "Current line(s)" },
    { label: CommandType.FILE, description: "Entire file" },
  ];

  const pick = await input.showQuickPick({
    title: "Translate PAWN Colors",
    step: 2,
    totalSteps: 2,
    placeholder: "Pick translation area",
    items: areas,
    shouldResume: () => Promise.resolve(false),
  });

  state.area = pick;
  return;
}