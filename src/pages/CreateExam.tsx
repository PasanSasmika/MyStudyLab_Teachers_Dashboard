import { useEffect, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import * as z from 'zod';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, Trash, Save, ArrowLeft } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

const examSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  batchId: z.string().min(1, "Please select a batch"),
  startTime: z.string().refine((val) => new Date(val) > new Date(), {
    message: "Start time must be in the future",
  }),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  pdfFile: z.any()
    .refine((files) => !files || files.length === 0 || files[0].size <= 5000000, "Max file size is 5MB")
    .optional(),
  questions: z.array(z.object({
    text: z.string().min(1, "Question text is required"),
    options: z.array(z.string().min(1, "Option is required")).length(4),
    correctIndex: z.coerce.number().min(0).max(3),
    marks: z.coerce.number().min(1)
  })).min(1, "At least one question is required"),
  
});

type ExamFormValues = z.infer<typeof examSchema>;

const defaultQuestion = {
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  marks: 1
};

interface Batch {
  _id: string;
  name: string;
}

export default function CreateExam() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema) as Resolver<ExamFormValues>,
    defaultValues: {
      duration: 60,
      questions: [defaultQuestion] 
    }
  });

  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  const watchedFile = watch('pdfFile');

  // Fetch Batches
  useEffect(() => {
    api.get('/batches').then((res) => setBatches(res.data)).catch(console.error);
  }, []);

  // --- 3. Submit Handler ---
  const onSubmit = async (data: ExamFormValues) => {
    setIsSubmitting(true);
    try {
      let resourcePdfUrl = '';

      // A. Upload PDF (if exists)
      if (data.pdfFile && data.pdfFile.length > 0) {
        const formData = new FormData();
        formData.append('file', data.pdfFile[0]);

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        resourcePdfUrl = uploadRes.data.url;
      }

      // B. Create Exam
      await api.post('/exams', {
        title: data.title,
        batchId: data.batchId,
        durationMinutes: data.duration,
        startTime: new Date(data.startTime).toISOString(),
        resourcePdfUrl,
        questions: data.questions
      });

      alert('Exam Created Successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to create exam. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full" type="button">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Create New Exam</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* --- Section 1: Basic Info --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Exam Title</label>
              <input 
                {...register("title")}
                className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Unit 5: Heat"
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            {/* Batch Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Batch</label>
              <select 
                {...register("batchId")}
                className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Class --</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              {errors.batchId && <p className="text-xs text-red-500 mt-1">{errors.batchId.message}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input 
                type="datetime-local" 
                {...register("startTime")}
                className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
              <input 
                type="number" 
                {...register("duration", { valueAsNumber: true })}
                className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration.message}</p>}
            </div>
          </div>

          {/* --- Section 2: PDF Upload --- */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition relative">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <label className="block mt-2 text-sm font-medium text-blue-600 cursor-pointer">
              <span>{watchedFile && watchedFile.length > 0 ? watchedFile[0].name : "Upload Question Paper (PDF)"}</span>
              <input 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                {...register("pdfFile")}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">Optional. Max 5MB.</p>
            {errors.pdfFile && <p className="text-xs text-red-500 mt-1">{String(errors.pdfFile.message)}</p>}
          </div>

          {/* --- Section 3: Dynamic Questions --- */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
              Questions
              <span className="text-sm font-normal text-gray-500">Total: {fields.length}</span>
            </h3>
            
            <div className="space-y-4">
              {fields.map((field, qIndex) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg border relative animate-in fade-in slide-in-from-bottom-2">
                  
                  {/* Remove Button */}
                  {fields.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => remove(qIndex)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition"
                      title="Remove Question"
                    >
                      <Trash size={16} />
                    </button>
                  )}

                  <div className="mb-3 pr-8">
                    <label className="text-xs font-bold text-gray-500 uppercase">Question {qIndex + 1}</label>
                    <input 
                      {...register(`questions.${qIndex}.text`)}
                      className="w-full p-2 border rounded mt-1"
                      placeholder="Enter question text..."
                    />
                    {errors.questions?.[qIndex]?.text && (
                      <p className="text-xs text-red-500">{errors.questions[qIndex]?.text?.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          value={oIndex}
                          {...register(`questions.${qIndex}.correctIndex`)}
                          // Important: Radio inputs in RHF need standard HTML behavior
                        />
                        <input 
                          {...register(`questions.${qIndex}.options.${oIndex}`)}
                          className="w-full p-2 text-sm border rounded"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Show error if options are missing */}
                  {errors.questions?.[qIndex]?.options && (
                    <p className="text-xs text-red-500 mt-1">All 4 options are required.</p>
                  )}

                  {/* Marks Input */}
                  <div className="mt-3 flex items-center gap-2 pr-8">
                    <label className="text-sm font-medium text-gray-700">Marks:</label>
                    <input 
                      type="number" 
                      min="1"
                      {...register(`questions.${qIndex}.marks`, { valueAsNumber: true })}
                      className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.questions?.[qIndex]?.marks && (
                      <p className="text-xs text-red-500">{errors.questions[qIndex]?.marks?.message}</p>
                    )}
                  </div>

                </div>
              ))}
            </div>

            <button 
              type="button"
              onClick={() => append(defaultQuestion)}
              className="flex items-center gap-2 text-blue-600 font-medium mt-4 hover:text-blue-800 transition"
            >
              <Plus size={18} /> Add Question
            </button>
          </div>

          {/* --- Footer --- */}
          <div className="pt-4 border-t flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
              <Save size={18} />
              {isSubmitting ? 'Publishing...' : 'Publish Exam'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}