import { useQuery } from "@tanstack/react-query";

export type TeamMember = {
  _id: string;
  companyId: string;
  userId: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
    email: string;
    id: string;
  };
  name: string;
  email: string;
  role: string;
  designation: string;
  dob: string;
  mobile: string;
  profileCreatedOn: string;
  profileImage: string;
  status?: string; // Added status property to fix TypeScript errors
  reportingManager: {
    name: string;
    email: string;
    id: string;
  };
};

export type MemberResponse = {
  message: string;
  code: number;
  data: TeamMember[];
};

const fetchMembers = async (companyId: string): Promise<MemberResponse> => {
  // Simple mock response since enterprise search is removed
  return {
    message: "Members retrieved successfully",
    code: 200,
    data: []
  };
};

const useMember = (companyId: string) => {
  return useQuery({
    queryKey: ["member", companyId],
    queryFn: async () => {
      const { data } = await fetchMembers(companyId);
      return data!;
    },
    enabled: !!companyId,
  });
};

export { useMember };
