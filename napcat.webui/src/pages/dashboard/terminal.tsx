import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import { Button } from '@heroui/button'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IoAdd, IoClose } from 'react-icons/io5'

import { TabList, TabPanel, Tabs } from '@/components/tabs'
import { SortableTab } from '@/components/tabs/sortable_tab.tsx'
import { TerminalInstance } from '@/components/terminal/terminal-instance'

import terminalManager from '@/controllers/terminal_manager'
import WebUIManager from '@/controllers/webui_manager'

interface TerminalTab {
  id: string
  title: string
}

export default function TerminalPage() {
  const [tabs, setTabs] = useState<TerminalTab[]>([])
  const [selectedTab, setSelectedTab] = useState<string>('')

  useEffect(() => {
    // 获取已存在的终端列表
    WebUIManager.getTerminalList().then((terminals) => {
      if (terminals.length === 0) return

      const newTabs = terminals.map((terminal) => ({
        id: terminal.id,
        title: terminal.id
      }))

      setTabs(newTabs)
      setSelectedTab(newTabs[0].id)
    })
  }, [])

  const createNewTerminal = async () => {
    try {
      const { id } = await WebUIManager.createTerminal(80, 24)
      const newTab = {
        id,
        title: id
      }

      setTabs((prev) => [...prev, newTab])
      setSelectedTab(id)
    } catch (error) {
      console.error('Failed to create terminal:', error)
      toast.error('创建终端失败')
    }
  }

  const closeTerminal = async (id: string) => {
    try {
      await WebUIManager.closeTerminal(id)
      terminalManager.removeTerminal(id)
      if (selectedTab === id) {
        const previousIndex = tabs.findIndex((tab) => tab.id === id) - 1
        if (previousIndex >= 0) {
          setSelectedTab(tabs[previousIndex].id)
        } else {
          setSelectedTab(tabs[0]?.id || '')
        }
      }
      setTabs((prev) => prev.filter((tab) => tab.id !== id))
    } catch (error) {
      toast.error('关闭终端失败')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setTabs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  return (
    <div className="flex flex-col gap-2 p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Tabs
          activeKey={selectedTab}
          onChange={setSelectedTab}
          className="h-full overflow-hidden"
        >
          <div className="flex items-center gap-2 flex-shrink-0 flex-grow-0">
            <TabList className="flex-1 !overflow-x-auto hide-scrollbar">
              <SortableContext
                items={tabs}
                strategy={horizontalListSortingStrategy}
              >
                {tabs.map((tab) => (
                  <SortableTab
                    key={tab.id}
                    id={tab.id}
                    value={tab.id}
                    isSelected={selectedTab === tab.id}
                    className="flex gap-2 items-center"
                  >
                    {tab.title}
                    <Button
                      isIconOnly
                      radius="full"
                      variant="flat"
                      size="sm"
                      className="min-w-0 w-4 h-4"
                      onPress={() => closeTerminal(tab.id)}
                      color={selectedTab === tab.id ? 'danger' : 'default'}
                    >
                      <IoClose />
                    </Button>
                  </SortableTab>
                ))}
              </SortableContext>
            </TabList>
            <Button
              isIconOnly
              color="danger"
              size="sm"
              variant="flat"
              onPress={createNewTerminal}
              startContent={<IoAdd />}
              className="text-xl"
            />
          </div>
          <div className="flex-grow overflow-hidden">
            {tabs.map((tab) => (
              <TabPanel key={tab.id} value={tab.id} className="h-full">
                <TerminalInstance id={tab.id} />
              </TabPanel>
            ))}
          </div>
        </Tabs>
      </DndContext>
    </div>
  )
}
