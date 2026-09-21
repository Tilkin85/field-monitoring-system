(function (root) {
  'use strict';
  const categories = {
    fossil: 'fossils', prehistoric: 'prehistoricArtifacts',
    historic: 'historicArtifacts', architectural: 'architecturalFeatures'
  };
  // Move earlier drafts into the four sheet fields once, retaining detailed context.
  function restore(defaults, saved) {
    if (!saved || !saved.mapData || !Array.isArray(saved.fieldObservations)) return defaults;
    const data = {...defaults, ...saved};
    data.stratigraphySelections = Array.isArray(saved.stratigraphySelections) ? saved.stratigraphySelections : [];
    data.additionalFindings = Array.isArray(saved.additionalFindings) ? saved.additionalFindings : [];
    data.schemaVersion = 2;
    if (saved.schemaVersion >= 2) return data;
    data.fieldObservations = saved.fieldObservations.map(observation => {
      const key = categories[observation.type];
      if (!key || !observation.description) return {...observation};
      data[key] = [data[key], observation.description].filter(Boolean).join('\n');
      return {...observation, description: ''};
    });
    return data;
  }
  root.APForm = {restore};
})(typeof window !== 'undefined' ? window : globalThis);
