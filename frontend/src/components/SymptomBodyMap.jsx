import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const bodyParts = {
  head: ['Headache', 'Dizziness', 'Vision problems', 'Ear pain', 'Sore throat', 'Nosebleed'],
  chest: ['Chest pain', 'Shortness of breath', 'Cough', 'Heart palpitations', 'Wheezing'],
  abdomen: ['Abdominal pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Bloating'],
  arms: ['Arm pain', 'Swelling', 'Numbness', 'Weakness', 'Joint pain'],
  legs: ['Leg pain', 'Swelling', 'Numbness', 'Weakness', 'Joint pain', 'Calf pain']
};

const SymptomBodyMap = ({ onSpecialtySuggested, onClose }) => {
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleBodyPartClick = (part) => {
    setSelectedBodyPart(part);
    setSelectedSymptoms([]);
  };

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleGetSuggestion = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please select at least one symptom.');
      return;
    }

    setIsLoading(true);
    try {
      const symptomsText = selectedSymptoms.join(', ');
      const { data } = await axios.post("https://docathome-backend.onrender.com/api/ai/suggest-specialty", {
        symptoms: symptomsText
      });
      onSpecialtySuggested(data.specialty, data.reasoning || '');
      onClose();
    } catch {
      toast.error('Could not get a suggestion. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Select Your Symptoms</h2>
      <p className="text-center text-gray-600 mb-8">Click on the body part where you're experiencing symptoms</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Human Body SVG */}
        <div className="flex-1 flex justify-center">
          <svg width="200" height="400" viewBox="0 0 200 400" className="border rounded-lg">
            {/* Head */}
            <circle
              cx="100"
              cy="40"
              r="25"
              fill={selectedBodyPart === 'head' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('head')}
            />
            {/* Neck */}
            <rect x="90" y="65" width="20" height="15" fill="#E5E7EB" stroke="#374151" strokeWidth="2" />

            {/* Chest */}
            <rect
              x="70"
              y="80"
              width="60"
              height="60"
              fill={selectedBodyPart === 'chest' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('chest')}
            />

            {/* Abdomen */}
            <rect
              x="70"
              y="140"
              width="60"
              height="50"
              fill={selectedBodyPart === 'abdomen' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('abdomen')}
            />

            {/* Left Arm */}
            <rect
              x="30"
              y="90"
              width="40"
              height="80"
              fill={selectedBodyPart === 'arms' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('arms')}
            />

            {/* Right Arm */}
            <rect
              x="130"
              y="90"
              width="40"
              height="80"
              fill={selectedBodyPart === 'arms' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('arms')}
            />

            {/* Left Leg */}
            <rect
              x="80"
              y="190"
              width="20"
              height="100"
              fill={selectedBodyPart === 'legs' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('legs')}
            />

            {/* Right Leg */}
            <rect
              x="100"
              y="190"
              width="20"
              height="100"
              fill={selectedBodyPart === 'legs' ? '#3B82F6' : '#E5E7EB'}
              stroke="#374151"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-200"
              onClick={() => handleBodyPartClick('legs')}
            />
          </svg>
        </div>

        {/* Symptoms Selection */}
        <div className="flex-1">
          {selectedBodyPart ? (
            <div>
              <h3 className="text-xl font-semibold mb-4 capitalize">
                Symptoms for {selectedBodyPart}
              </h3>
              <div className="space-y-2 mb-6">
                {bodyParts[selectedBodyPart].map((symptom) => (
                  <label key={symptom} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => handleSymptomToggle(symptom)}
                      className="rounded"
                    />
                    <span>{symptom}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleGetSuggestion}
                disabled={isLoading || selectedSymptoms.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Getting Suggestion...' : 'Get Specialty Suggestion'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Select a body part to view symptoms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomBodyMap;