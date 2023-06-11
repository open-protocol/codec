import { Codec } from ".";

const from = "01";
const to = "02";
const value = "01";
const nonce = 2;
const input = "00";
const signature = "01";

test("encode and decode test", () => {
  const encoded = Codec.encode([from, to, value, nonce, input, signature]);
  expect(encoded.toString("hex")).toBe(
    "0302003031030200303203020030310201000203020030300302003031"
  );
  const decoded = Codec.decode(encoded);
  expect(decoded[0]).toBe(from);
  expect(decoded[1]).toBe(to);
  expect(decoded[2]).toBe(value);
  expect(decoded[3]).toBe(nonce);
  expect(decoded[4]).toBe(input);
  expect(decoded[5]).toBe(signature);
});

test("encode buffer test", () => {
  const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
  const encoded = Codec.encode([buffer]);
  const decoded = Codec.decode(encoded);
  expect((decoded[0] as Buffer).toString("hex")).toBe("0001020304");
});

test("encode string test", () => {
  const str =
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc";
  const encoded = Codec.encode([str]);
  const decoded = Codec.decode(encoded);
  expect(decoded[0]).toBe(
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc"
  );
});

test("encode number test", () => {
  const num1 = 1000000000;
  const encoded1 = Codec.encode([num1]);
  expect(encoded1.toString("hex")).toBe("0204003b9aca00");
  const decoded1 = Codec.decode(encoded1);
  expect(decoded1[0]).toBe(1000000000);

  const num2 = 1;
  const encoded2 = Codec.encode([num2]);
  expect(encoded2.toString("hex")).toBe("02010001");
  const decoded2 = Codec.decode(encoded2);
  expect(decoded2[0]).toBe(1);
});

test("array encode test", () => {
  const array = [
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc",
    "ff",
    "ffff",
    100,
  ];
  const encoded = Codec.encode([array]);
  expect(encoded.toString("hex")).toBe(
    "04530000000340003765396364383535646462323033393634363439646130393665626261303531353037306462393161306266636261393665346636393261643538326632646303020066660304006666666602010064"
  );
});

test("map encode test", () => {
  const map = new Map<string, string>();
  map.set("00", "01");
  map.set(
    "01",
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc"
  );
  map.set("02", "ffff");
  const encoded = Codec.encode([map]);
  expect(encoded.toString("hex")).toBe(
    "055e00000003020030300302003031030200303103400037653963643835356464623230333936343634396461303936656262613035313530373064623931613062666362613936653466363932616435383266326463030200303203040066666666"
  );
});

test("array decode test", () => {
  const array = [
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc",
    "ff",
    "ffff",
    100,
  ];
  const encoded = Codec.encode([array]);
  const decoded = Codec.decode(encoded);
  for (let i = 0; i < array.length; i++) {
    expect(decoded[0]![i]).toBe(array[i]);
  }
});

test("map decode test", () => {
  const map = new Map<string, string>();
  map.set("00", "01");
  map.set(
    "01",
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc"
  );
  map.set("02", "ffff");
  const encoded = Codec.encode([map]);
  const decoded = Codec.decode(encoded);
  for (const key in encoded) {
    expect((decoded[0] as any).get(key)).toBe(map.get(key));
  }
});

test("full encode and decode test", () => {
  const str =
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc";
  const num = 1000000000;
  const array = [
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc",
    "ff",
    "ffff",
    100,
  ];
  const map = new Map<string, string>();
  map.set("00", "01");
  map.set(
    "01",
    "7e9cd855ddb203964649da096ebba0515070db91a0bfcba96e4f692ad582f2dc"
  );
  map.set("02", "ffff");
  const encoded = Codec.encode([str, num, array, map]);
  const decoded = Codec.decode(encoded);
  expect(decoded[0]).toBe(str);
  expect(decoded[1]).toBe(num);
  for (let i = 0; i < array.length; i++) {
    expect(decoded[2]![i]).toBe(array[i]);
  }
  for (const key in encoded) {
    expect((decoded[3] as any).get(key)).toBe(map.get(key));
  }
});
