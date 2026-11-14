export default function Stepper ({ steps, selectedStep, changeCallback }) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => {
        let className;
        if (selectedStep === index) {
          className = 'is-current';
        } else if (selectedStep > index) {
          className = 'is-lower show-bar';
        }
        const stepName = (step.name && step.name.trim()) || '\u00a0';
        return (
          <li key={index} className={className} data-step=" " onClick={() => changeCallback(index)}>{stepName}</li>
        );
      })}
    </ol>
  );
}
