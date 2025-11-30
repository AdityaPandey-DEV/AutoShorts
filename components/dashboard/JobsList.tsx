import Card from '@/components/ui/Card';

interface Job {
  id: number;
  status: string;
  prompt: string;
  youtubeVideoId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface JobsListProps {
  jobs: Job[];
}

export default function JobsList({ jobs }: JobsListProps) {
  if (jobs.length === 0) {
    return (
      <Card>
        <p className="text-gray-600">No videos generated yet. Create your first one above!</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Recent Videos</h3>
      <div className="space-y-3">
        {jobs.slice(0, 5).map((job) => (
          <div key={job.id} className="border-b border-gray-200 pb-3 last:border-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {job.prompt.substring(0, 60)}...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: <span className="font-semibold">{job.status}</span>
                </p>
                {job.youtubeVideoId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${job.youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-red-600 hover:underline mt-1 inline-block"
                  >
                    View on YouTube →
                  </a>
                )}
                {job.errorMessage && (
                  <p className="text-sm text-red-600 mt-1">{job.errorMessage}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

