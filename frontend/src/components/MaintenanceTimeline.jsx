import React from 'react';

const MaintenanceTimeline = ({ requests, onStatusChange }) => {
  const columns = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];

  const getRequestsByStatus = (status) => {
    return requests.filter(req => req.status === status);
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-240px)] overflow-x-auto overflow-y-hidden border border-gray-800 rounded-lg bg-gray-900">
      {columns.map((column, index) => (
        <div 
          key={column} 
          className={`min-w-[250px] flex-1 p-4 flex flex-col ${index !== columns.length - 1 ? 'border-r border-gray-800' : ''}`}
        >
          <h3 className="text-sm font-medium text-gray-400 mb-4 pb-2 border-b border-gray-800 capitalize text-center shrink-0">
            {column}
          </h3>
          
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {getRequestsByStatus(column).map(request => (
              <div 
                key={request._id} 
                className={`p-3 rounded-lg border bg-gray-800 text-sm ${
                  column === 'Resolved' ? 'border-green-800' : 'border-gray-700'
                }`}
              >
                <div className="font-semibold text-gray-200">{request.assetId?.assetCode || 'AF-Unknown'}</div>
                <div className="text-gray-400 mt-1">{request.issueDescription}</div>
                {request.technician && (
                  <div className="text-gray-500 mt-2 text-xs">tech: {request.technician}</div>
                )}
                {column === 'Resolved' && (
                  <div className="text-green-500 mt-2 text-xs">resolved {new Date(request.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                )}
                
                {/* Simple action buttons to move cards for demo purposes */}
                {column !== 'Resolved' && (
                  <button 
                    onClick={() => onStatusChange(request._id, columns[columns.indexOf(column) + 1])}
                    className="mt-3 text-xs w-full bg-gray-700 hover:bg-gray-600 py-1 rounded transition"
                  >
                    Move to {columns[columns.indexOf(column) + 1]}
                  </button>
                )}
              </div>
            ))}
            
            {getRequestsByStatus(column).length === 0 && (
              <div className="text-center text-gray-600 text-sm py-4 border-2 border-dashed border-gray-800 rounded-lg">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaintenanceTimeline;