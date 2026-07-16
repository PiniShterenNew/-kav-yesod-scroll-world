# קו יסוד — Higgsfield video prompts V1

## הגדרות קבועות

### דסקטופ

- Model: `Seedance 2.0 Unlimited`
- Mode: `Standard`
- Resolution: `720p`
- Duration: `5 seconds`
- Aspect ratio: `16:9`
- Audio: `Off`
- Input: Start frame + End frame

### מובייל

- Model: `Seedance 2.0 Unlimited`
- Mode: `Standard`
- Resolution: `720p`
- Duration: `5 seconds`
- Aspect ratio: `9:16`
- Audio: `Off`
- Input: Start frame + End frame

Do not enable an additional camera-motion preset. Use the custom prompt only.

## Common negative prompt

If Higgsfield provides a separate negative-prompt field, paste this block into it. If there is no negative field, append it to the end of the main prompt.

```text
cuts, jump cuts, dissolve, crossfade, fade to black, camera shake, handheld motion, sudden zoom, whip pan, fisheye distortion, chaotic morphing, melting architecture, collapsing structure, warped walls, duplicated floors, duplicated windows, changing landscape, changing house identity, new buildings, people, workers, vehicles, cranes, machinery, text, letters, numbers, signage, logo, watermark, captions, UI, excessive dust, smoke, fire, dramatic clouds, flicker, exposure pulsing, color shift, shallow focus, blurry final frame
```

---

# Desktop — 16:9

## D01 — Opening to Planning

Start:

`public/assets/scroll-world/desktop/01-opening.png`

End:

`public/assets/scroll-world/desktop/02-planning.png`

Output filename:

`01-opening-to-planning-v1.mp4`

Prompt:

```text
Single continuous cinematic architectural camera move, no cuts. Begin with the exact completed limestone villa and Mediterranean hillside shown in the start frame. The camera performs a slow controlled push forward while rising slightly into a refined elevated three-quarter view. As the camera advances, the finished architectural layers of the same villa separate vertically in a precise, physically ordered exploded-model transformation: the roof plate, upper floor and selected facade layers lift gently while preserving the exact house geometry. The immediate ground transitions subtly into the premium architectural planning surface shown in the end frame, with restrained plan lines, material samples and vellum entering naturally at the edges. End by settling smoothly into the exact architectural planning composition of the provided end frame. Preserve the same villa identity, hillside, olive trees, limestone, warm golden-hour direction and premium editorial realism throughout. Graceful slow motion, stable architecture, subtle parallax, exact start and end compositions.
```

## D02 — Planning to Foundations

Start:

`public/assets/scroll-world/desktop/02-planning.png`

End:

`public/assets/scroll-world/desktop/03-foundations.png`

Output filename:

`02-planning-to-foundations-v1.mp4`

Prompt:

```text
Single continuous cinematic architectural camera move, no cuts. Begin on the exact exploded architectural planning model shown in the start frame. The camera glides slowly forward and descends toward the model base, following the engraved plan geometry. The separated roof and floor plates remain perfectly aligned while the finished miniature house layers retract upward and out of the camera path in an ordered architectural reveal. The pale drawing surface gradually gains real depth and texture: plan lines become excavation edges, the model base becomes compacted hillside soil, and the precise footprint develops into reinforced-concrete footings, grade beams, foundation walls and vertical rebar cages. The material samples and vellum move naturally toward the frame edges without flying or disappearing abruptly. End by settling into the exact real foundation construction composition of the supplied end frame. Preserve the same footprint, camera direction, Mediterranean hillside, olive trees, distant hills and warm golden-hour light. Slow controlled descent, physically plausible transformation, subtle parallax, stable geometry, exact start and end compositions.
```

## D03 — Foundations to Structure

Start:

`public/assets/scroll-world/desktop/03-foundations.png`

End:

`public/assets/scroll-world/desktop/04-structure.png`

Output filename:

`03-foundations-to-structure-v1.mp4`

Prompt:

```text
Single continuous cinematic architectural camera move, no cuts. Begin with the exact reinforced-concrete foundations shown in the start frame. The camera moves gently forward and rises in one smooth controlled arc, following the vertical reinforcement bars. The existing rebar cages extend upward and become accurately cast concrete columns; beams form between them; the lower slab, upper floor slab and flat roof develop sequentially from bottom to top. The central stair rises inside the frame and the signature cantilever grows from the same foundation footprint. A small amount of timber formwork remains briefly around the newest beam, then resolves into the exact structural stage shown in the end frame. Construction must assemble in a disciplined engineering sequence, never appear magically or chaotically. Preserve the same site, footprint, stairs, terraces, camera side, hillside, trees, distant landscape and right-hand golden-hour sunlight. The camera finishes at the exact elevated three-quarter structural composition of the supplied end frame. Slow graceful motion, clean stable geometry, realistic gravity, exact start and end compositions.
```

## D04 — Structure to Systems

Start:

`public/assets/scroll-world/desktop/04-structure.png`

End:

`public/assets/scroll-world/desktop/05-systems.png`

Output filename:

`04-structure-to-systems-v1.mp4`

Prompt:

```text
Single continuous cinematic architectural camera move, no cuts. Begin with the exact concrete structural frame shown in the start image. The camera performs a slow forward glide toward the central open bay while rising only slightly. As it approaches, pale masonry infill walls assemble carefully between the existing columns without changing the structural geometry. Inside the open frame, coordinated building systems grow along physically plausible routes: restrained red and blue utility lines, black drainage stacks, slim silver climate ducts, electrical conduits, recessed service boxes and one narrow insulated wall bay. The systems follow the columns, slabs and service shaft instead of floating in space. Maintain an elegant controlled cutaway so the architecture remains dominant and the central stair and cantilever stay recognizable. End by settling smoothly into the exact systems composition of the supplied end frame. Preserve the same house, footprint, camera direction, hillside, olive trees and warm golden-hour light. Stable forward motion, subtle interior parallax, technically ordered installation, exact start and end compositions.
```

## D05 — Systems to Finishes

Start:

`public/assets/scroll-world/desktop/05-systems.png`

End:

`public/assets/scroll-world/desktop/06-finishes.png`

Output filename:

`05-systems-to-finishes-v1.mp4`

Prompt:

```text
Single continuous cinematic architectural camera move, no cuts. Begin with the exact coordinated building-systems cutaway shown in the start frame. The camera glides slowly forward and slightly outward from the open middle level. Wall construction closes in a clear physical sequence around the existing services: insulation settles into the bays, backing layers align, pale plaster surfaces finish cleanly, and most conduits disappear behind the completed walls while one narrow vertical service cutaway remains visible. Slim black glazing installs into the exact openings; cream limestone cladding aligns across the facade; warm timber fins, natural stone floors, oak joinery and restrained recessed lighting resolve progressively into place. The transition must feel like careful craftsmanship, not a magical makeover. End in the exact near-complete finishes composition of the supplied end frame, preserving the same villa geometry, camera side, terraces, hillside, trees and golden-hour direction. Warm interior light develops gently without exposure flicker. Smooth controlled motion, stable materials, exact start and end compositions.
```

## D06 — Finishes to Handover

Start:

`public/assets/scroll-world/desktop/06-finishes.png`

End:

`public/assets/scroll-world/desktop/07-handover.png`

Output filename:

`06-finishes-to-handover-v1.mp4`

Prompt:

```text
Single continuous cinematic architectural camera move, no cuts. Begin with the exact nearly finished villa and narrow exposed service bay shown in the start frame. The camera makes a slow elegant pull back and rises slightly, revealing the complete house and hillside. The final service bay closes in an ordered sequence: insulation, backing layer, plaster, limestone and timber align precisely with the finished facade. Remaining construction surfaces cleanly resolve into completed terraces and entrance paths. Native Mediterranean planting fills out gently and naturally around the existing retaining walls; exterior and interior architectural lights warm gradually as the sun lowers, without changing the time of day abruptly. The house remains the same exact villa with the same windows, cantilever, stairs, materials and landscape. End in a calm stable hero view matching the exact handover composition supplied as the end frame, with the entire completed villa clearly visible and no construction elements remaining. Graceful pullback, subtle parallax, quiet premium handover mood, exact start and end compositions.
```

---

# Mobile — 9:16

## M01 — Opening to Planning

Start:

`public/assets/scroll-world/mobile/01-opening.png`

End:

`public/assets/scroll-world/mobile/02-planning.png`

Output filename:

`01-opening-to-planning-mobile-v1.mp4`

Prompt:

```text
Single continuous vertical cinematic architectural camera move, no cuts. Begin with the exact completed villa centered in the lower portion of the portrait start frame, preserving the generous clean sky above it. The camera pushes forward slowly and rises along the central vertical axis, never drifting sideways out of the narrow composition. The same villa transforms into a precisely aligned exploded architectural model: roof and floor plates lift vertically in a controlled sequence while the building identity, windows, cantilever and terraces remain stable. The immediate terrain transitions into the refined planning surface, with plan geometry, vellum and restrained material samples entering only near the lower edges. Preserve the clean upper area throughout for website copy. End in the exact portrait planning composition of the provided end frame. Same hillside, olive trees, warm limestone and golden-hour direction. Smooth slow movement, restrained vertical parallax, stable centered architecture, exact start and end compositions.
```

## M02 — Planning to Foundations

Start:

`public/assets/scroll-world/mobile/02-planning.png`

End:

`public/assets/scroll-world/mobile/03-foundations.png`

Output filename:

`02-planning-to-foundations-mobile-v1.mp4`

Prompt:

```text
Single continuous vertical cinematic architectural camera move, no cuts. Begin on the exact portrait architectural model and planning surface shown in the start frame. The camera descends slowly along the centered house axis, following the engraved footprint while preserving the clear upper portion of the image. The elevated architectural plates retract upward in an orderly aligned sequence as the planning surface gains physical depth. Plan lines become real excavation boundaries; pale model material becomes compacted hillside earth; the same footprint develops into concrete footings, foundation walls, grade beams, gravel layers and vertical rebar. Keep the transformation centered and readable on a narrow screen, with no important construction detail escaping the side edges. End in the exact portrait foundation composition of the supplied end frame. Preserve the same hillside, trees, distant landscape, warm golden light and camera direction. Slow controlled descent, realistic construction logic, stable geometry, exact start and end compositions.
```

## M03 — Foundations to Structure

Start:

`public/assets/scroll-world/mobile/03-foundations.png`

End:

`public/assets/scroll-world/mobile/04-structure.png`

Output filename:

`03-foundations-to-structure-mobile-v1.mp4`

Prompt:

```text
Single continuous vertical cinematic architectural camera move, no cuts. Begin with the exact centered foundation grid in the portrait start frame. The camera rises slowly along the vertical reinforcement bars, maintaining a stable central axis and generous calm headroom. Existing rebar cages extend upward into accurately cast columns; beams connect; floor slabs and the flat roof assemble sequentially from the foundations upward. The internal stair and signature cantilever develop from the exact same footprint. The house grows vertically inside the narrow portrait frame without widening, drifting sideways or being cropped. Preserve the stepped hillside, olive trees, retaining walls and right-hand golden-hour light. End at the exact portrait structural-frame composition of the supplied end frame. Graceful upward motion, disciplined engineering sequence, subtle parallax through the frame, stable geometry, exact start and end compositions.
```

## M04 — Structure to Systems

Start:

`public/assets/scroll-world/mobile/04-structure.png`

End:

`public/assets/scroll-world/mobile/05-systems.png`

Output filename:

`04-structure-to-systems-mobile-v1.mp4`

Prompt:

```text
Single continuous vertical cinematic architectural camera move, no cuts. Begin with the exact portrait concrete frame shown in the start image. The camera makes a slow centered push through the main open bay, with only a slight upward movement and no wide lateral orbit. Pale masonry walls assemble carefully between the existing columns. Coordinated red and blue utility lines, black drainage, slim silver climate ducts, electrical conduits and a narrow insulated service shaft develop along realistic routes inside the same structure. Keep the systems concentrated in the central vertical service zone so they remain legible on a narrow screen, while the architecture, stair and cantilever remain dominant. Preserve the clear upper image area, house identity, hillside and warm golden-hour light. End in the exact portrait systems composition of the supplied end frame. Smooth controlled movement, subtle interior parallax, no floating components, exact start and end compositions.
```

## M05 — Systems to Finishes

Start:

`public/assets/scroll-world/mobile/05-systems.png`

End:

`public/assets/scroll-world/mobile/06-finishes.png`

Output filename:

`05-systems-to-finishes-mobile-v1.mp4`

Prompt:

```text
Single continuous vertical cinematic architectural camera move, no cuts. Begin with the exact portrait systems cutaway shown in the start frame. The camera rises gently along the central service shaft and pulls outward just enough to reveal the finishing work, never drifting beyond the narrow composition. Insulation, backing layers and pale plaster close around the coordinated services in a precise physical sequence, leaving one slim vertical service cutaway visible. Black glazing, cream limestone cladding, warm timber fins, natural stone floors, oak joinery and soft recessed lighting resolve progressively into their exact final locations. Keep the house centered in the lower and middle portions of the frame and preserve the clean upper area for website text. Maintain the same architecture, hillside, olive trees and golden-hour direction. End in the exact portrait finishes composition supplied as the end frame. Calm craftsmanship, stable materials, subtle vertical parallax, exact start and end compositions.
```

## M06 — Finishes to Handover

Start:

`public/assets/scroll-world/mobile/06-finishes.png`

End:

`public/assets/scroll-world/mobile/07-handover.png`

Output filename:

`06-finishes-to-handover-mobile-v1.mp4`

Prompt:

```text
Single continuous vertical cinematic architectural camera move, no cuts. Begin with the exact near-complete villa and narrow exposed service strip in the portrait start frame. The camera pulls back slowly and rises slightly on the central axis, keeping the complete villa centered and fully inside the narrow frame. The last service strip closes layer by layer into the final limestone and timber facade. Remaining unfinished ground resolves into clean entrance paths and terraces; restrained native Mediterranean planting matures naturally around the retaining walls; warm exterior and interior lighting develops gently as the sun lowers. Preserve the generous calm sky above the house for website copy and do not allow the building to rise into that safe area. The villa identity, windows, cantilever, stairs and material palette remain unchanged. End in the exact portrait handover hero composition of the provided end frame. Quiet premium completion, graceful pullback, stable architecture, exact start and end compositions.
```

---

## Recommended rendering order

Render and inspect in this order:

1. `D01`
2. `D02`
3. `D03`
4. `D04`
5. `D05`
6. `D06`
7. `M01`
8. `M02`
9. `M03`
10. `M04`
11. `M05`
12. `M06`

Do not continue after a clip that changes the villa identity, introduces a cut, or fails to match its end frame. Save every accepted clip with the exact versioned filename listed above.