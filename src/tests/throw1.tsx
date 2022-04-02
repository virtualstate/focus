async function Throw1() {
  throw new Error();
}

try {
  await Throw1();
} catch (error) {
  console.log(error);
}

export default 1;
