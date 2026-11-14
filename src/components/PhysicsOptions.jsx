import './physicsOptions.css';

export const defaultPhysicsOptions = {
  isEnabled: true,
  jaspersReplusionBetweenParticles: true,
  viscousDragCoefficient: 0.2,
  hooksSprings: {
    restLength: 50,
    springConstant: 0.2,
    dampingConstant: 0.1
  },
  particles: {
    mass: 1
  }
};

export default function PhysicsOptions ({ options, changedCallback }) {
  const {
    isEnabled, jaspersReplusionBetweenParticles, viscousDragCoefficient, hooksSprings, particles
  } = options;

  return (
    <div className="physics-options">
      <div>
        <input type="checkbox" name="isEnabled" value="isEnabled" checked={isEnabled} onChange={() => changedCallback({ isEnabled: !isEnabled })} />
        <label style={{ cursor: 'default' }} onClick={() => changedCallback({ isEnabled: !isEnabled })}>Enabled</label>
      </div>
      <div>
        <label htmlFor="hooksSprings_restLength">Spring Rest Length</label>
        <input id="hooksSprings_restLength" type="number" step="any" name="hooksSprings_restLength" value={hooksSprings.restLength} onChange={event => changedCallback({ hooksSprings: { restLength: event.currentTarget.valueAsNumber } })} />
      </div>
      <div>
        <label htmlFor="hooksSprings_springConstant">Spring Constant</label>
        <input id="hooksSprings_springConstant" type="number" min="0" step="any" max="1" name="hooksSprings_springConstant" value={hooksSprings.springConstant} onChange={event => changedCallback({ hooksSprings: { springConstant: event.currentTarget.valueAsNumber } })} />
      </div>
      <div>
        <label htmlFor="hooksSprings_dampingConstant">Spring Damping Constant</label>
        <input id="hooksSprings_dampingConstant" type="number" min="0" step="any" max="1" name="hooksSprings_dampingConstant" value={hooksSprings.dampingConstant} onChange={event => changedCallback({ hooksSprings: { dampingConstant: event.currentTarget.valueAsNumber } })} />
      </div>
      <div>
        <label htmlFor="viscousDragCoefficient">Viscous Drag Coefficient</label>
        <input id="viscousDragCoefficient" type="number" min="0" step="any" max="1" name="viscousDragCoefficient" value={viscousDragCoefficient} onChange={event => changedCallback({ viscousDragCoefficient: event.currentTarget.valueAsNumber })} />
      </div>
      <div>
        <label htmlFor="particles_mass">Particle Mass</label>
        <input id="particles_mass" type="number" min="0.1" step="any" name="particles_mass" value={particles.mass} onChange={event => changedCallback({ particles: { mass: event.currentTarget.valueAsNumber } })} />
      </div>
      <div>
        <input type="checkbox" name="jaspersReplusionBetweenParticles" value="jaspersReplusionBetweenParticles" checked={jaspersReplusionBetweenParticles} onChange={() => changedCallback({ jaspersReplusionBetweenParticles: !jaspersReplusionBetweenParticles })} />
        <label style={{ cursor: 'default' }} onClick={() => changedCallback({ jaspersReplusionBetweenParticles: !jaspersReplusionBetweenParticles })}>Jasper&apos;s repulsion between particles</label>
      </div>
    </div>
  );
}
