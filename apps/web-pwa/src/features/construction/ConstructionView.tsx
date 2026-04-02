import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

const workers = [
  { name: "Rakib", zone: "A1", status: "Present" },
  { name: "Sakib", zone: "B2", status: "Absent" },
  { name: "Jahid", zone: "C3", status: "Present" },
  { name: "Nabil", zone: "A2", status: "Present" },
];

const materials = [
  { item: "Cement", stock: 72 },
  { item: "Steel Rod", stock: 48 },
  { item: "Sand", stock: 88 },
  { item: "Brick", stock: 61 },
];

export function ConstructionView() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Worker Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Worker</Th>
                <Th>Geo Zone</Th>
                <Th>Attendance</Th>
              </tr>
            </thead>
            <tbody>
              {workers.map((row) => (
                <tr key={row.name}>
                  <Td>{row.name}</Td>
                  <Td>{row.zone}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.status === "Present" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {row.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {materials.map((row) => (
            <div key={row.item} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{row.item}</span>
                <span className="text-muted-foreground">{row.stock}%</span>
              </div>
              <progress
                className="h-2 w-full overflow-hidden rounded-full bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
                max={100}
                value={row.stock}
                aria-label={`${row.item} stock level`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
